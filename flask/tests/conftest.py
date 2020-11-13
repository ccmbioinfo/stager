import os, pytest
from app import create_app, db
from app.config import Config


class TestConfig(Config):
    """
    Pytest config settings.
    Uses MySQL database called "st2020testing" for adding/removing test data.
    """

    FLASK_ENV = "development"
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "TEST_ST_DATABASE_URI", "mysql+pymysql://admin:admin@localhost/st2020testing"
    )
    MINIO_ENDPOINT = os.getenv("TEST_MINIO_ENDPOINT", "localhost:9000")
    MINIO_SECRET_KEY = os.getenv(
        "TEST_MINIO_SECRET_KEY", "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
    )
    MINIO_ACCESS_KEY = os.getenv("TEST_MINIO_ACCESS_KEY", "AKIAIOSFODNN7EXAMPLE")
    TESTING = True


@pytest.fixture(scope="session")
def application():
    """
    A test instance of the app.
    Will be reused for all tests.
    """
    test_app = create_app(TestConfig)
    yield test_app


@pytest.fixture(scope="class")
def client(application):
    """
    A test client that can issue requests.
    Will create a fresh empty db for every test.
    """

    # Setup
    with application.app_context():
        db.create_all()

    # Do the things
    with application.test_client() as test_client:
        with application.app_context():
            yield test_client

    # Teardown
    with application.app_context():
        db.drop_all()
