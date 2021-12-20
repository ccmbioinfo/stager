import atexit
import logging
import os


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
from apscheduler.schedulers.background import BackgroundScheduler

from flask import Flask
from flask import logging as flask_logging
from slurm_rest import Configuration

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
        app.logger.info("Configuring with Slurm REST API %s", app.config["SLURM_ENDPOINT"])
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
    logging.basicConfig(
        format="[%(levelname)s] %(asctime)s %(name)s (%(funcName)s, line %(lineno)s): %(message)s",
        datefmt="%m/%d/%Y %I:%M:%S %p",
    )

    if app.config["SQLALCHEMY_LOG"]:
        logging.getLogger("sqlalchemy.engine").setLevel(logging.INFO)
        logging.getLogger("sqlalchemy.pool").setLevel(logging.INFO)

    flask_logging.create_logger(app)
