import logging

from authlib.oauth2.rfc6749 import grants
from authlib.integrations.sqla_oauth2 import (
    create_query_client_func,
    create_save_token_func,
)
from flask import Flask, logging as flask_logging


from .extensions import db, login, migrate, oauth, authorization
from .utils import DateTimeEncoder
from .models import OAuth2Client, OAuth2Token, User

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
    register_oauth_authorization(app)


class PasswordGrant(grants.ResourceOwnerPasswordCredentialsGrant):
    def authenticate_user(self, username, password):
        user = User.query.filter_by(username=username).first()
        if user is not None and user.check_password(password):
            return user

    TOKEN_ENDPOINT_AUTH_METHODS = ["client_secret_post"]


def register_oauth_authorization(app):
    query_client = create_query_client_func(db.session, OAuth2Client)
    save_token = create_save_token_func(db.session, OAuth2Token)
    authorization.init_app(app, query_client=query_client, save_token=save_token)
    authorization.register_grant(PasswordGrant)


def config_logger(app):
    logging.basicConfig(
        format="[%(levelname)s] %(asctime)s %(name)s (%(funcName)s, line %(lineno)s): %(message)s",
        datefmt="%m/%d/%Y %I:%M:%S %p",
    )

    if app.config["SQLALCHEMY_LOG"]:
        logging.getLogger("sqlalchemy.engine").setLevel(logging.INFO)
        logging.getLogger("sqlalchemy.pool").setLevel(logging.INFO)

    flask_logging.create_logger(app)
