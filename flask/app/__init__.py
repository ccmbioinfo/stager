import logging
from flask import Flask, logging as flask_logging
from .extensions import db, login, migrate

from app import (
    buckets,
    routes,
    families,
    datasets,
    participants,
    tissue_samples,
    analyses,
    groups,
    users,
    manage,
)


def create_app(config):
    """
    The application factory. Returns an instance of the app.
    """

    # Create the application object
    app = Flask(__name__)
    app.config.from_object(config)

    register_extensions(app)
    register_commands(app)
    register_blueprints(app)
    config_logger(app)

    return app


def register_blueprints(app):

    app.register_blueprint(routes.routes)

    app.register_blueprint(families.family_blueprint)
    app.register_blueprint(datasets.datasets_blueprint)
    app.register_blueprint(participants.participants_blueprint)
    app.register_blueprint(tissue_samples.tissue_blueprint)
    app.register_blueprint(analyses.analyses_blueprint)

    app.register_blueprint(buckets.bucket_blueprint)
    app.register_blueprint(groups.groups_blueprint)
    app.register_blueprint(users.users_blueprint)


def register_extensions(app):
    db.init_app(app)
    migrate.init_app(app, db)
    login.init_app(app)


def register_commands(app):
    app.cli.add_command(manage.add_dummy_data)
    app.cli.add_command(manage.add_default_admin)


def config_logger(app):

    if app.config["SQLALCHEMY_LOG"]:
        logging.basicConfig()
        logging.getLogger("sqlalchemy.engine").setLevel(logging.INFO)
        logging.getLogger("sqlalchemy.pool").setLevel(logging.INFO)

    flask_logging.create_logger(app)
