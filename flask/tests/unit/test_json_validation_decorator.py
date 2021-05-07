""" test json validator """
from unittest.mock import patch
from unittest import TestCase
from werkzeug.exceptions import UnsupportedMediaType
from app.utils import validate_json


class ValidationTest(TestCase):
    """ test class for validation """

    @patch("app.utils.request")
    def test_validate_json_throws_415_on_non_json_header(self, mock_request):
        """ test that validate_json throws when content-type is not json """
        mock_request.headers = {"Content-Type": "application/foo"}

        @validate_json
        def mock_route():
            return True

        with self.assertRaises(UnsupportedMediaType):
            mock_route()

    @patch("app.utils.request")
    def test_validate_json_passes_on_json_header(self, mock_request):
        """ test that validate_json raises no exception when content-type is json """
        mock_request.headers = {"Content-Type": "application/json"}

        @validate_json
        def mock_route():
            return True

        assert mock_route()
