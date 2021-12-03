from flask_login import LoginManager
from flask_migrate import Migrate
from flask_sqlalchemy import SQLAlchemy
from authlib.integrations.flask_client import OAuth
from prometheus_flask_exporter.multiprocess import GunicornPrometheusMetrics

db = SQLAlchemy()
login = LoginManager()
migrate = Migrate(compare_type=True)
oauth = OAuth()
metrics = GunicornPrometheusMetrics(None, path=None)

login.session_protection = "strong"
