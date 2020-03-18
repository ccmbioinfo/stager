import os

class Config(object):
    SECRET_KEY = os.getenv('ST_SECRET_KEY', 'YOUR_SECRET_KEY')
    SQLALCHEMY_DATABASE_URI = os.getenv(
        'ST_DATABASE_URI', 'mysql+pymysql://admin:admin@localhost/st2020'
    )
    SQLALCHEMY_TRACK_MODIFICATIONS=False
