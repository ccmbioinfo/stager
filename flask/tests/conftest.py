import pytest
from app import *


@pytest.fixture
def client():
    """ A test client that can issue requests. """

    # Setup
    test_app = create_app(testing=True)

    with test_app.test_client() as test_client:
        yield test_client

    # Teardown

