from unittest import mock
from unittest.mock import patch
from pytest import raises

from werkzeug.exceptions import Unauthorized

from app.utils import require_login_or_token_with_role
from app import db, models


@patch("flask_login.utils.request")
@patch("flask_login.utils.current_user")
@patch("flask_login.utils.current_app.login_manager")
@patch("app.utils.request")
def test_require_login_or_token_with_role_returns_unauthorized(
    mock_local_request,
    mock_manager,
    mock_user,
    mock_request,
    client,
    application,
):
    """test that require_login_or_token_with_role returns unuathorized when no user is logged in and there is no authorization header"""

    application.config["ENABLE_OIDC"] = True

    mock_user.is_authenticated = False
    mock_manager.unauthorized.side_effect = Unauthorized
    mock_local_request.headers.get.return_value = None

    @require_login_or_token_with_role("test")
    def mock_route():
        return True

    with raises(Unauthorized):
        mock_route()


@patch("flask_login.utils.request")
@patch("flask_login.utils.current_user")
def test_require_login_or_token_with_role_autorizes_request_when_user_is_authenticated(
    mock_user, mock_request, client
):
    """test that require_login_or_token_with_role authorizes request when user is logged in"""

    mock_user.is_authenticated = True

    @require_login_or_token_with_role("test")
    def mock_route():
        return True

    assert mock_route() is True


@patch("flask_login.utils.request")
@patch("flask_login.utils.current_user")
@patch("flask_login.utils.current_app.login_manager")
@patch("app.utils.fetch_userinfo")
@patch("app.utils.request")
def test_require_login_or_token_with_role_authorizes_request_when_user_has_appropriate_role(
    mock_request,
    mock_userinfo_endpoint,
    mock_manager,
    mock_flask_login_user,
    mock_local_request,
    client,
    test_database,
):
    """test that require_login_or_token_with_role authorizes request with no user logged in but token is valid and user proxy exists"""

    client_user_proxy_sub = "abc"

    client_user_proxy = models.User(
        username="test",
        password_hash="123",
        email="test@test.com",
        deactivated=False,
        subject=client_user_proxy_sub,
    )

    db.session.add(client_user_proxy)
    db.session.commit()

    mock_flask_login_user.is_authenticated = False
    mock_manager.unauthorized.side_effect = Unauthorized
    mock_local_request.headers = {"Authorization": "Bearer testtest"}
    mock_userinfo_endpoint.return_value = {
        "realm_access": {"roles": ["test"]},
        "sub": client_user_proxy_sub,
    }

    @require_login_or_token_with_role("test")
    def mock_route(
        client_user=None,
    ):
        assert client_user.user_id == client_user_proxy.user_id
        return True

    assert mock_route() is True


@patch("flask_login.utils.request")
@patch("flask_login.utils.current_user")
@patch("flask_login.utils.current_app.login_manager")
@patch("app.utils.fetch_userinfo")
@patch("app.utils.request")
def test_require_login_or_token_with_role_fails_request_when_user_has_wrong_role(
    mock_local_request,
    mock_userinfo_endpoint,
    mock_manager,
    mock_flask_login_user,
    mock_request,
    client,
    test_database,
    application,
):
    """test that require_login_or_token_with_role returns does not authorize request when token user does not have specified role"""

    application.config["ENABLE_OIDC"] = True

    client_user_proxy_sub = "abc"

    client_user_proxy = models.User(
        username="test",
        password_hash="123",
        email="test@test.com",
        deactivated=False,
        subject=client_user_proxy_sub,
    )

    db.session.add(client_user_proxy)
    db.session.commit()

    mock_flask_login_user.is_authenticated = False
    mock_manager.unauthorized.side_effect = Unauthorized
    mock_local_request.headers = {"Authorization": "Bearer testtest"}
    mock_userinfo_endpoint.return_value = {
        "realm_access": {"roles": ["wrong"]},
        "sub": client_user_proxy_sub,
    }

    @require_login_or_token_with_role("test")
    def mock_route():
        return True

    with raises(Unauthorized):
        mock_route()
