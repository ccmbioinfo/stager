import atexit
from os import getenv
from logging import Formatter

from apscheduler.schedulers.base import BaseScheduler
from apscheduler.schedulers.background import BackgroundScheduler
from authlib.integrations.flask_client import OAuth
from flask import Flask, logging as flask_logging
from flask_migrate import Migrate
from flask_sqlalchemy import SQLAlchemy
from prometheus_flask_exporter import PrometheusMetrics
from prometheus_flask_exporter.multiprocess import GunicornPrometheusMetrics
from requests import Session
from slurm_rest import Configuration, ApiClient
from slurm_rest.apis import SlurmApi

from .login import StagerLoginManager
from .tasks import send_email_notification
from .utils import DateTimeEncoder
from .slurm import poll_slurm


class Stager(Flask):
    """
    Main application subclass, instead of cluttering __init__ and create_app.
    """

    json_encoder = DateTimeEncoder
    # Only available in master process
    scheduler: BaseScheduler

    def __init__(self, config, db: SQLAlchemy, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.config.from_object(config)
        # Configures Flask's logger and customize. N.B.: logging modules conflict in name
        flask_logging.create_logger(self)
        # %(asctime)s may be useful is redundant with Docker timestamps and production journald
        flask_logging.default_handler.setFormatter(
            Formatter("%(levelname)s [%(funcName)s, line %(lineno)s]: %(message)s")
        )
        # Initialize extensions
        db.init_app(self)
        self.migrate = Migrate(self, db, compare_type=True)
        # The rest are not required for Click commands, but required for routes, shell, tests, etc.
        self.oauth = OAuth(self)
        self.oauth.register(
            name=self.config["OIDC_PROVIDER"],
            client_id=self.config["OIDC_CLIENT_ID"],
            client_secret=self.config["OIDC_CLIENT_SECRET"],
            server_metadata_url=self.config["OIDC_WELL_KNOWN"],
            client_kwargs={"scope": "openid"},
        )
        self.login = StagerLoginManager(self)

        if self.config["SLURM_ENDPOINT"]:
            self.logger.info(
                "Configuring with Slurm REST API %s", self.config["SLURM_ENDPOINT"]
            )
            # Could instead use one environment variable and urllib.parse.urlsplit for this
            self.config["slurm"] = Configuration(
                host=self.config["SLURM_ENDPOINT"],
                api_key={
                    "user": self.config["SLURM_USER"],
                    "token": self.config["SLURM_JWT"],
                },
            )
            # The thread pool used for requests is not instantiated until first use, so it is
            # safe to construct this object in the master process pre-fork.
            self.extensions["slurm"] = SlurmApi(ApiClient(self.config["slurm"]))
            # Access ApiClient if needed with .api_client
        else:
            self.config["slurm"] = self.extensions["slurm"] = None

        if self.env == "development":
            # Note that /metrics will not be live without DEBUG_METRICS set
            self.metrics = PrometheusMetrics(self)
        else:  # production
            # Must additionally set PROMETHEUS_MULTIPROC_DIR
            self.metrics = GunicornPrometheusMetrics(self, path=None)
        self.metrics.info(
            "stager", "Stager process info", revision=self.config.get("GIT_SHA")
        )

        if self.env == "development":
            # avoid starting additional threads for Click commands or
            # duplicating the scheduler in the dev server master process
            self.before_first_request(self.start_scheduler)
        # in production, a gunicorn hook will start the scheduler

    def start_scheduler(self):
        # If this setup of when the scheduler can be started becomes too confusing
        # or cumbersome, it can be separated to be started by a completely different
        # entrypoint in the same codebase and deployed as a separate container.
        self.scheduler = BackgroundScheduler()
        if getenv("SENDGRID_API_KEY"):
            self.logger.info(
                "Configuring with SendGrid [%s] (from: %s) (to: %s)",
                getenv("SENDGRID_EMAIL_TEMPLATE_ID"),
                getenv("SENDGRID_FROM_EMAIL"),
                getenv("SENDGRID_TO_EMAIL"),
            )
            self.scheduler.add_job(
                send_email_notification, "cron", [self], day_of_week="mon-fri", hour="9"
            )
        if self.config["SLURM_JWT"]:
            # requests session used to bypass the SDK when Slurm doesn't respect
            # its own API Schema (e.g. job response properties .array_job_id)
            self.extensions["slurm-requests"] = Session()
            self.scheduler.add_job(poll_slurm, "interval", [self], minutes=2)
        self.scheduler.start()
        if self.env == "development":
            # in production, a gunicorn exit hook will take care of this
            atexit.register(self.scheduler.shutdown)
