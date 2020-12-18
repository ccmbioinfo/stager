import logging
from flask import Flask, logging as flask_logging
from flask_login import LoginManager
from flask_migrate import Migrate
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()
login = LoginManager()
migrate = Migrate()


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
)


def create_app(config):
    """
    The application factory. Returns an instance of the app.
    """

    # Create the application object
    app = Flask(__name__)

    app.config.from_object(config)

    if config.SQLALCHEMY_LOG:
        logging.basicConfig()
        logging.getLogger("sqlalchemy.engine").setLevel(logging.INFO)
        logging.getLogger("sqlalchemy.pool").setLevel(logging.INFO)

    flask_logging.create_logger(app)
    login.session_protection = "strong"

    db.init_app(app)
    login.init_app(app)
    migrate.init_app(app, db)

    register_blueprints(app)

    with app.app_context():
        # Import here so that other modules have access to the app context
        from . import manage

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
