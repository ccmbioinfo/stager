from typing import Any, Dict

from authlib.integrations.flask_client import OAuth
from flask import current_app as app, Request
from flask_login import LoginManager
import requests
from werkzeug.exceptions import Unauthorized

from .models import User


def load_user(uid: int) -> User:
    return User.query.get(uid)


def fetch_userinfo(token: str) -> Dict[str, Any]:
    """get roles and other information from the userinfo endpoint"""
    provider = app.config.get("OIDC_PROVIDER")
    client = app.oauth.create_client(provider)
    userinfo_endpoint = client.load_server_metadata().get("userinfo_endpoint")
    userinfo_response = requests.get(
        userinfo_endpoint, headers={"Authorization": f"Bearer {token}"}
    )

    if userinfo_response.status_code == 401:
        raise Unauthorized

    return userinfo_response.json()


def get_user_identity_from_userinfo(user_info: Dict[str, Any]) -> User:
    """find token user based on subject identifier"""
    sub = user_info["sub"]
    return User.query.filter(User.subject == sub).first()


def load_user_from_request(request: Request) -> User:
    """if user session can't be found, this function will be called to look for it elsewhere"""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not app.config.get("ENABLE_OIDC"):
        return None
    token = auth_header[7:]
    try:
        user_info = fetch_userinfo(token)
    except Unauthorized:
        app.logger.info("Invalid Token!")
        return None
    return get_user_identity_from_userinfo(user_info)


class StagerLoginManager(LoginManager):
    """
    Flask-Login manager. Must be initialized with a Stager Flask instance as it depends on app.oauth
    """

    session_protection = "strong"

    def __init__(self, stager):
        if not (hasattr(stager, "oauth") and isinstance(stager.oauth, OAuth)):
            raise TypeError("Flask application is missing oauth attribute")
        super().__init__(stager)
        self.user_loader(load_user)
        self.request_loader(load_user_from_request)
