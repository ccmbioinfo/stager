import logging
from flask import Flask, logging as flask_logging
from flask_login import LoginManager
from flask_migrate import Migrate
from flask_sqlalchemy import SQLAlchemy

from app.config import Config

logging.basicConfig()
logging.getLogger('sqlalchemy.engine').setLevel(logging.INFO)
logging.getLogger('sqlalchemy.pool').setLevel(logging.INFO)

app = Flask(__name__)
app.config.from_object(Config)
flask_logging.create_logger(app)
login = LoginManager(app)
login.session_protection = 'strong'
db = SQLAlchemy(app)
migrate = Migrate(app, db)

from app.manage import *
from app.routes import *
from app.buckets import *
from app.util import *
