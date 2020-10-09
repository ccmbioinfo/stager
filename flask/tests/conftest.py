import pytest
from app import *


@pytest.fixture(scope="class")
def client():
    """ A test client that can issue requests. """

    # Setup
    test_app = create_app(testing=True)

    # Do the things
    with test_app.test_client() as test_client:
        with test_app.app_context():
            yield test_client

    # Teardown
    with test_app.app_context():
        db.drop_all()
