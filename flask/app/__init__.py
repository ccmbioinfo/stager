import logging
from flask import Flask, logging as flask_logging
from .extensions import db, login, migrate, oauth
from .utils import DateTimeEncoder

from app import (
    buckets,
    genes,
    routes,
    families,
    datasets,
    participants,
    tissue_samples,
    analyses,
    variants,
    groups,
    users,
    manage,
    error_handler,
)


def create_app(config):
    """
    The application factory. Returns an instance of the app.
    """

    # Create the application object
    app = Flask(__name__)
    app.config.from_object(config)
    app.json_encoder = DateTimeEncoder

    config_logger(app)
    register_extensions(app)
    manage.register_commands(app)
    register_blueprints(app)

    return app


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


def config_logger(app):
    logging.basicConfig(
        format="[%(levelname)s] %(asctime)s %(name)s (%(funcName)s, line %(lineno)s): %(message)s",
        datefmt="%m/%d/%Y %I:%M:%S %p",
    )

    if app.config["SQLALCHEMY_LOG"]:
        logging.getLogger("sqlalchemy.engine").setLevel(logging.INFO)
        logging.getLogger("sqlalchemy.pool").setLevel(logging.INFO)

    flask_logging.create_logger(app)
