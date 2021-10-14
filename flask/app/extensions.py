from authlib.integrations.flask_client import OAuth
from authlib.integrations.flask_oauth2 import (
    AuthorizationServer,
)
from flask_login import LoginManager
from flask_migrate import Migrate
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()
login = LoginManager()
migrate = Migrate(compare_type=True)
oauth = OAuth()

login.session_protection = "strong"

authorization = AuthorizationServer()
