import os
from typing import Any, Dict

from flask_login import current_user, login_required
from sqlalchemy.orm import joinedload

from flask import Blueprint, current_app as app, current_app as app
from flask import jsonify, request

from . import db, models
from .madmin import MinioAdmin
from .utils import check_admin, transaction_or_abort

users_blueprint = Blueprint(
    "users",
    __name__,
)


@users_blueprint.route("/api/users", methods=["GET"])
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


def jsonify_user(user: models.User):
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


@users_blueprint.route("/api/users/<string:username>", methods=["GET"])
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

    return jsonify_user(user)


def reset_minio_credentials(user: models.User) -> None:
    minio_admin = MinioAdmin(
        endpoint=app.config["MINIO_ENDPOINT"],
        access_key=app.config["MINIO_ACCESS_KEY"],
        secret_key=app.config["MINIO_SECRET_KEY"],
    )
    if user.minio_access_key:
        try:
            minio_admin.remove_user(user.minio_access_key)
        except RuntimeError as err:
            app.logger.warning(err.args[0])
    # Generate cryptographically random pair
    access_key = os.urandom(8).hex()  # 16 ASCII characters
    secret_key = os.urandom(16).hex()  # 32 ASCII characters
    # Probability of conflict is negligible and not considered
    minio_admin.add_user(access_key, secret_key)
    for group in user.groups:
        # MinIO requires a user to exist to create the group so the access policy
        # might not be set on a group if this is the first user to be added, however
        # we can guarantee from POST /api/groups that the policy exists in MinIO
        minio_admin.group_add(group.group_code, access_key)
        minio_admin.set_policy(group.group_code, group=group.group_code)
    user.minio_access_key = access_key
    user.minio_secret_key = secret_key


@users_blueprint.route("/api/users/<string:username>", methods=["POST"])
@login_required
def reset_minio_user(username: str):
    if (
        not app.config.get("LOGIN_DISABLED")
        and not current_user.is_admin
        and username != current_user.username
    ):
        return "Unauthorized", 401
    if not request.json:
        return "Request body must be JSON", 415
    user = (
        models.User.query.options(joinedload(models.User.groups))
        .filter(models.User.username == username)
        .first_or_404()
    )
    # TODO: maybe rate limit this API because generating these is expensive
    reset_minio_credentials(user)
    transaction_or_abort(db.session.commit)
    return jsonify(
        {
            "minio_access_key": user.minio_access_key,
            "minio_secret_key": user.minio_secret_key,
        }
    )


def valid_strings(body: Dict[str, Any], *keys: str) -> bool:
    return all(
        map(
            lambda key: key in body and isinstance(body[key], str) and len(body[key]),
            keys,
        )
    )


# Really the only way to verify an email is to test it because the RFC for what
# is a valid email address is hideously complex. There are at least two PyPI packages
# that properly test this but they already start checking the domains. The app isn't
# planning to use the emails so this check is vastly simplified.
def verify_email(email: str) -> bool:
    space = email.find(" ")
    at = email.find("@")
    dot = email.find(".", at)
    return space == -1 and at > 0 and dot > at + 1


@users_blueprint.route("/api/users", methods=["POST"])
@login_required
@check_admin
def create_user():
    if not request.json:
        return "Request body must be JSON", 415

    if not valid_strings(request.json, "username", "email", "password"):
        return "Missing fields", 400
    if (
        len(request.json["username"]) > models.User.username.type.length
        or len(request.json["email"]) >= models.User.email.type.length
    ):
        return "Username or email too long", 400
    if not verify_email(request.json["email"]):
        return "Bad email", 400

    user = models.User.query.filter(
        (models.User.username == request.json["username"])
        | (models.User.email == request.json["email"])
    ).first()
    if user is not None:
        # TODO: integrate with #219
        if user.username == request.json["username"]:
            error = {"error": "existingUser", "message": "User already exists."}
        else:
            error = {"error": "existingEmail", "message": "Email already in use."}
        return jsonify(error), 422, {"location": f"/api/users/{user.username}"}

    user = models.User(
        username=request.json["username"],
        email=request.json["email"],
        is_admin=request.json.get("is_admin"),
    )
    user.set_password(request.json["password"])

    requested_groups = request.json.get("groups")
    if requested_groups:
        groups = models.Group.query.filter(
            models.Group.group_code.in_(requested_groups)
        ).all()
        if len(requested_groups) != len(groups):
            return "Invalid group code provided", 404
        user.groups += groups

    reset_minio_credentials(user)
    db.session.add(user)
    transaction_or_abort(db.session.commit)
    return jsonify_user(user), 201, {"location": f"/api/users/{user.username}"}
