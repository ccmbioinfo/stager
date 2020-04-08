from flask import Flask, logging
from flask_login import LoginManager
from flask_migrate import Migrate
from flask_sqlalchemy import SQLAlchemy

from app.config import Config

app = Flask(__name__)
app.config.from_object(Config)
logging.create_logger(app)
login = LoginManager(app)
login.session_protection = 'strong'
db = SQLAlchemy(app)
migrate = Migrate(app, db)

from app.routes import *
