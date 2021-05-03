import os


class Config(object):
    """
    The base config. All shared config values are kept here.
    """

    GIT_SHA = os.getenv("GIT_SHA")
    SECRET_KEY = os.getenv("ST_SECRET_KEY", "YOUR_SECRET_KEY")
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "ST_DATABASE_URI", "mysql+pymysql://admin:admin@localhost/st2020"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_LOG = True
    LOGIN_DISABLED = True
    DEFAULT_ADMIN = os.getenv("ST_DEFAULT_ADMIN", "admin")
    DEFAULT_ADMIN_EMAIL = os.getenv(
        "ST_DEFAULT_EMAIL", "admin@sampletracker.ccm.sickkids.ca"
    )
    DEFAULT_PASSWORD = os.getenv("ST_DEFAULT_PASSWORD", "eternity")
    MINIO_ENDPOINT = os.getenv("MINIO_ENDPOINT", "localhost:9000")
    MINIO_SECRET_KEY = os.getenv(
        "MINIO_SECRET_KEY", "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
    )
    MINIO_ACCESS_KEY = os.getenv("MINIO_ACCESS_KEY", "AKIAIOSFODNN7EXAMPLE")
    TESTING = False
