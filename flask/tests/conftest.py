import pytest
from app import *
import os


class TestConfig(config.Config):
    """
    Pytest config settings.
    Uses MySQL database called "st2020testing" for adding/removing test data.
    """

    FLASK_ENV = "development"
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "ST_DATABASE_URI_TESTING", "mysql+pymysql://admin:admin@localhost/st2020testing"
    )
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
