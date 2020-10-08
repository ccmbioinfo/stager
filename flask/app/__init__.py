import logging
from flask import Flask, logging as flask_logging
from flask_login import LoginManager
from flask_migrate import Migrate
from flask_sqlalchemy import SQLAlchemy
from . import config

logging.basicConfig()
logging.getLogger('sqlalchemy.engine').setLevel(logging.INFO)
logging.getLogger('sqlalchemy.pool').setLevel(logging.INFO)

db = SQLAlchemy()
login = LoginManager()
migrate = Migrate()


def create_app():
    """
    The application factory. Returns an instance of the app.
    """

    app = Flask(__name__)
    app.config.from_object(config.DevConfig)

    flask_logging.create_logger(app)

    login.session_protection = 'strong'

    db.init_app(app)
    login.init_app(app)
    migrate.init_app(app, db)

    with app.app_context():
        from . import manage
        from . import routes
        from . import buckets

        db.create_all()

        return app
