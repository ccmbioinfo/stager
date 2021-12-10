from flask_login import LoginManager
from flask_marshmallow import Marshmallow
from flask_migrate import Migrate
from flask_sqlalchemy import SQLAlchemy
from authlib.integrations.flask_client import OAuth

db = SQLAlchemy()
login = LoginManager()
migrate = Migrate(compare_type=True)
oauth = OAuth()
ma = Marshmallow()
login.session_protection = "strong"
