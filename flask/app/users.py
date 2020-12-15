from flask import current_app as app, jsonify
from flask_login import current_user, login_required
from sqlalchemy.orm import joinedload

from . import models
from .routes import check_admin


@app.route("/api/users", methods=["GET"])
@login_required
@check_admin
def list_users():
    users = models.User.query.options(joinedload(models.User.groups)).all()
    return jsonify(
        [
            {
                "username": user.username,
                "email": user.email,
                "is_admin": user.is_admin,
                "last_login": user.last_login,
                "deactivated": user.deactivated,
                "groups": [group.group_code for group in user.groups],
            }
            for user in users
        ]
    )


@app.route("/api/users/<string:username>", methods=["GET"])
@login_required
def get_user(username: str):
    if (
        not app.config.get("LOGIN_DISABLED")
        and not current_user.is_admin
        and username != current_user.username
    ):
        return "Unauthorized", 401

    user = (
        models.User.query.options(joinedload(models.User.groups))
        .filter(models.User.username == username)
        .first_or_404()
    )

    return jsonify(
        {
            "username": user.username,
            "email": user.email,
            "is_admin": user.is_admin,
            "last_login": user.last_login,
            "deactivated": user.deactivated,
            "groups": [group.group_code for group in user.groups],
            "minio_access_key": user.minio_access_key,
            "minio_secret_key": user.minio_secret_key,
        }
    )
