""" test that our request loader function works as expected """
from unittest.mock import patch, MagicMock

from flask import Request

from app.models import load_user_from_request, User, OAuth2Token


@patch("app.models.StagerBearerTokenValidator")
def test_can_get_user_with_token(mock_validator):

    user = User(user_id=12345)

    token = OAuth2Token()
    token.user = user

    mock_validator.return_value.return_value = token

    mock_request = MagicMock(Request)

    mock_request.headers = {"Authorization": "Bearer actual_token_logic_is_mocked"}

    loaded_user = load_user_from_request(mock_request)

    assert loaded_user.user_id == user.user_id


@patch("app.models.StagerBearerTokenValidator")
def test_fails_with_no_auth_header(mock_validator):

    user = User(user_id=12345)

    token = OAuth2Token()
    token.user = user

    mock_validator.return_value.return_value = token

    mock_request = MagicMock(Request)

    mock_request.headers = {"NOT_Authorization": "Bearer actual_token_logic_is_mocked"}

    assert load_user_from_request(mock_request) is None
