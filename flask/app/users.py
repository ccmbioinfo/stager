import os
from typing import Any, Dict

from flask import Blueprint, current_app as app, jsonify, request
from flask_login import current_user, login_required
from sqlalchemy.orm import joinedload

from . import models
from .extensions import db
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


def get_minio_admin() -> MinioAdmin:
    return MinioAdmin(
        endpoint=app.config["MINIO_ENDPOINT"],
        access_key=app.config["MINIO_ACCESS_KEY"],
        secret_key=app.config["MINIO_SECRET_KEY"],
    )


def safe_remove(user: models.User, minio_admin: MinioAdmin = None) -> None:
    """
    Remove the corresponding MinIO identity for this user from MinIO if it exists.
    """
    if user.minio_access_key:
        minio_admin = minio_admin or get_minio_admin()
        try:
            minio_admin.remove_user(user.minio_access_key)
        except RuntimeError as err:
            app.logger.warning(err.args[0])


def reset_minio_credentials(user: models.User) -> None:
    minio_admin = get_minio_admin()
    safe_remove(user, minio_admin)
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


def validate(body: Dict[str, Any], key: str, kind: type) -> bool:
    return key in body and isinstance(body[key], kind)


def valid_strings(body: Dict[str, Any], *keys: str) -> bool:
    return all(map(lambda key: validate(body, key, str) and len(body[key]), keys))


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


@users_blueprint.route("/api/users/<string:username>", methods=["DELETE"])
@login_required
@check_admin
def delete_user(username: str):
    user = models.User.query.filter_by(username=username).first_or_404()
    try:
        db.session.delete(user)
        db.session.commit()
    except:
        db.session.rollback()
        # Assume user foreign key required elsewhere and not other error
        return "This user can only be deactivated", 422

    safe_remove(user)

    return "Deleted", 204


@users_blueprint.route("/api/users/<string:username>", methods=["PATCH"])
@login_required
def update_user(username: str):
    if not request.json:
        return "Request body must be JSON", 415

    if app.config.get("LOGIN_DISABLED") or current_user.is_admin:
        minio_admin = get_minio_admin()
        user = (
            models.User.query.filter_by(username=username)
            .options(joinedload(models.User.groups))
            .first_or_404()
        )
        old_username = user.username

        requested_groups = request.json.get("groups")
        if requested_groups:
            groups = models.Group.query.filter(
                models.Group.group_code.in_(requested_groups)
            ).all()
            if len(requested_groups) != len(groups):
                return "Invalid group code provided", 404

            if user.minio_access_key:
                for group in user.groups:
                    # Reset existing group memberships
                    minio_admin.group_remove(group.group_code, user.minio_access_key)

                user.groups = groups
                for group_code in requested_groups:
                    # Add to group
                    minio_admin.group_add(group_code, user.minio_access_key)
                    # Reset policy for group in case the group did not exist
                    minio_admin.set_policy(group_code, group=group_code)

        if valid_strings(request.json, "username"):
            user.username = request.json["username"]
        if valid_strings(request.json, "email") and verify_email(request.json["email"]):
            user.email = request.json["email"]
        if validate(request.json, "is_admin", kind=bool):
            user.is_admin = request.json["is_admin"]
        if validate(request.json, "deactivated", kind=bool):
            user.deactivated = request.json["deactivated"]
            if user.deactivated and user.minio_access_key:
                safe_remove(user, minio_admin)
                user.minio_access_key = None
                user.minio_secret_key = None
        if valid_strings(request.json, "password"):
            user.set_password(request.json["password"])

        transaction_or_abort(db.session.commit)
        if old_username != user.username:
            return jsonify_user(user), {"location": f"/api/users/{user.username}"}
        else:
            return jsonify_user(user)

    # Update the current user's password given the existing password
    elif username == current_user.username:
        if "current" not in request.json or "password" not in request.json:
            return "Bad request", 400
        if not current_user.check_password(request.json["current"]):
            return "Incorrect password", 401
        current_user.set_password(request.json["password"])
        try:
            db.session.commit()
            return "Updated", 204
        except:
            db.session.rollback()
            return "Server error", 500

    else:
        return "Unauthorized", 403
