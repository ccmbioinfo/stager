from flask_caching import Cache
from flask_login import LoginManager
from flask_migrate import Migrate
from flask_sqlalchemy import SQLAlchemy
from authlib.integrations.flask_client import OAuth

db = SQLAlchemy()
login = LoginManager()
migrate = Migrate(compare_type=True)
oauth = OAuth()
cache = Cache(
    config={"CACHE_TYPE": "SimpleCache", "CACHE_DEFAULT_TIMEOUT": 922337203685477580}
)

login.session_protection = "strong"
