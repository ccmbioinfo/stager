from flask_caching import Cache
from flask_login import LoginManager
from flask_migrate import Migrate
from flask_sqlalchemy import SQLAlchemy
from authlib.integrations.flask_client import OAuth

db = SQLAlchemy()
login = LoginManager()
migrate = Migrate(compare_type=True)
oauth = OAuth()

login.session_protection = "strong"
