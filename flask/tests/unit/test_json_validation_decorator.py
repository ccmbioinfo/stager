from pytest import raises
from werkzeug.exceptions import UnsupportedMediaType
from app.utils import validate_json


def test_validate_json_throws_415_on_non_json_header(application):
    """test that validate_json throws when content-type is not json"""

    @validate_json
    def mock_route():
        return True

    with application.test_request_context(
        "/api", headers={"Content-Type": "application/foo"}
    ):

        with raises(UnsupportedMediaType):
            mock_route()


def test_validate_json_passes_on_json_header(application):
    """test that validate_json raises no exception when content-type is json"""

    @validate_json
    def mock_route():
        return True

    with application.test_request_context(
        "/api", headers={"Content-Type": "application/json"}
    ):

        assert mock_route()
