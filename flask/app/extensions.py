from os import getenv
from flask_login import LoginManager
from flask_marshmallow import Marshmallow
from flask_migrate import Migrate
from flask_sqlalchemy import SQLAlchemy
from authlib.integrations.flask_client import OAuth
from prometheus_flask_exporter import PrometheusMetrics
from prometheus_flask_exporter.multiprocess import GunicornPrometheusMetrics

db = SQLAlchemy()
# login = LoginManager()
# migrate = Migrate(compare_type=True)
# oauth = OAuth()
# ma = Marshmallow()
# login.session_protection = "strong"

# if getenv("FLASK_ENV") == "development":
#     # Note that /metrics will not be live without DEBUG_METRICS set
#     metrics = PrometheusMetrics(None)
# else:  # production
#     # Must additionally set PROMETHEUS_MULTIPROC_DIR
#     metrics = GunicornPrometheusMetrics(None, path=None)
