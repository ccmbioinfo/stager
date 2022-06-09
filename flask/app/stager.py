import atexit
from os import getenv
import os

from apscheduler.schedulers.base import BaseScheduler
from apscheduler.schedulers.background import BackgroundScheduler
from authlib.integrations.flask_client import OAuth
from flask import Flask
from flask_migrate import Migrate
from flask_sqlalchemy import SQLAlchemy
from prometheus_flask_exporter import PrometheusMetrics
from prometheus_flask_exporter.multiprocess import GunicornPrometheusMetrics

from .login import StagerLoginManager
from .tasks import send_email_notification
from .utils import DateTimeEncoder


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
        else:  # production, start in master process
            self.start_scheduler()

    def start_scheduler(self):
        # If this setup of when the scheduler can be started becomes too confusing
        # or cumbersome, it can be separated to be started by a completely different
        # entrypoint in the same codebase and deployed as a separate container.
        self.scheduler = BackgroundScheduler()
        self.scheduler.add_job(
            lambda: self.logger.info(os.getpid()), "interval", seconds=5
        )
        if getenv("SENDGRID_API_KEY"):
            self.scheduler.add_job(
                send_email_notification, "cron", [self], day_of_week="mon-fri", hour="9"
            )
        self.scheduler.start()
        atexit.register(self.scheduler.shutdown)
