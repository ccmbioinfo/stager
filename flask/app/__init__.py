import atexit
import logging
import os
from stat import S_ISFIFO

from apscheduler.schedulers.background import BackgroundScheduler
from flask import Flask, logging as flask_logging
from slurm_rest import Configuration

from app import (
    analyses,
    buckets,
    datasets,
    error_handler,
    families,
    genes,
    groups,
    manage,
    participants,
    routes,
    tissue_samples,
    users,
    variants,
)
from .extensions import db, login, ma, metrics, migrate, oauth
from .tasks import send_email_notification
from .utils import DateTimeEncoder


def create_app(config):
    """
    The application factory. Returns an instance of the app.
    """
    # Create the application object
    app = Flask(__name__)
    app.config.from_object(config)
    app.json_encoder = DateTimeEncoder

    config_logger(app)

    if app.config["SLURM_ENDPOINT"]:
        app.logger.info(
            "Configuring with Slurm REST API %s", app.config["SLURM_ENDPOINT"]
        )
        app.config["slurm"] = Configuration(host=app.config["SLURM_ENDPOINT"])
        app.config["slurm"].api_key["user"] = app.config["SLURM_USER"]
        app.config["slurm"].api_key["token"] = app.config["SLURM_JWT"]
    else:
        app.config["slurm"] = None

    register_extensions(app)
    manage.register_commands(app)
    register_blueprints(app)
    if os.getenv("SENDGRID_API_KEY"):
        register_schedulers(app)

    return app


def register_schedulers(app):
    scheduler = BackgroundScheduler(timezone="America/Toronto")
    scheduler.add_job(
        send_email_notification, "cron", [app], day_of_week="mon-fri", hour="9"
    )

    scheduler.start()

    # Shut down the scheduler when exiting the app
    atexit.register(scheduler.shutdown)


def register_blueprints(app):

    app.register_blueprint(routes.routes)

    app.register_blueprint(families.family_blueprint)
    app.register_blueprint(datasets.datasets_blueprint)
    app.register_blueprint(participants.participants_blueprint)
    app.register_blueprint(tissue_samples.tissue_blueprint)
    app.register_blueprint(analyses.analyses_blueprint)
    app.register_blueprint(genes.genes_blueprint)
    app.register_blueprint(variants.variants_blueprint)

    app.register_blueprint(buckets.bucket_blueprint)
    app.register_blueprint(groups.groups_blueprint)
    app.register_blueprint(users.users_blueprint)

    app.register_blueprint(error_handler.error_blueprint)


def register_extensions(app):
    db.init_app(app)
    ma.init_app(app)
    migrate.init_app(app, db)
    login.init_app(app)
    oauth.init_app(app)
    oauth.register(
        name=app.config["OIDC_PROVIDER"],
        client_id=app.config["OIDC_CLIENT_ID"],
        client_secret=app.config["OIDC_CLIENT_SECRET"],
        server_metadata_url=app.config["OIDC_WELL_KNOWN"],
        client_kwargs={"scope": "openid"},
    )
    metrics.init_app(app)
    metrics.info("stager", "Stager process info", revision=app.config.get("GIT_SHA"))


def config_logger(app):
    """
    Configure the main loggers: Flask application, SQLAlchemy, and werkzeug

    SQLAlchemy logs can be very noisy and hard to filter out with grep because
    the logged queries can span multiple lines. However, they are still useful
    for auditing query efficiency and performance. Therefore, instead of using
    basicConfig to configure the log handler and formatter at the root level,
    which affects all loggers, the SQLAlchemy logger is configured separately
    from the application logger.

    Configuring handlers to write to a file instead of stdout violates Docker's
    approach to logging. Instead, divert logs to a sidecar container so the
    SQLAlchemy logs are separated from application logs. The application
    container and the sidecar container both mount the same volume to share the
    logs. This solution is adapted from a Kubernetes paradigm.

    In production, SQLALCHEMY_SIDECAR specifies a writable filesystem path.
    Rather than using a regular file that would increase the disk space required
    for these logs and need to be rotated, use a FIFO or named pipe. This is
    equivalent to `app | sidecar`, but we cannot use a regular pipe across
    containers. This does not use disk space to redundantly store the logs, and
    the sidecar can still output the logs the same way with `tail`.
    """
    if app.config["SQLALCHEMY_LOG"]:
        sidecar = os.getenv("SQLALCHEMY_SIDECAR")
        if sidecar:
            try:
                os.mkfifo(sidecar)
            except FileExistsError:
                if not S_ISFIFO(os.stat(sidecar).st_mode):
                    raise
            handler = logging.FileHandler(sidecar)
            handler.setFormatter(
                logging.Formatter("%(levelname)s [%(name)s] %(message)s")
            )
            logging.getLogger("sqlalchemy").addHandler(handler)
        logging.getLogger("sqlalchemy.engine").setLevel(logging.INFO)
        logging.getLogger("sqlalchemy.pool").setLevel(logging.INFO)
    # This configures Flask's logger and then we can customize it after
    flask_logging.create_logger(app)
    # %(asctime)s may be useful in development but redundant in production with journald
    flask_logging.default_handler.setFormatter(
        logging.Formatter("%(levelname)s [%(funcName)s, line %(lineno)s]: %(message)s")
    )
