import os
from typing import Any, Dict
from urllib.parse import quote

from flask import abort, Blueprint, current_app as app, jsonify, request, Response
from flask_login import current_user, login_required
from sqlalchemy.orm import joinedload

from . import models
from .extensions import db
from .madmin import MinioAdmin
from .utils import check_admin, get_minio_admin, transaction_or_abort, validate_json


users_blueprint = Blueprint(
    "users",
    __name__,
)


@users_blueprint.route("/api/users", methods=["GET"])
@login_required
@check_admin
def list_users() -> Response:
    """
    Enumerates all users. Administrator-only.
    """
    app.logger.info("Retrieving all users and groups.")
    users = models.User.query.options(joinedload(models.User.groups)).all()
    app.logger.info("Success, returning JSON..")
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


def jsonify_user(user: models.User) -> Response:
    """
    Helper function for serializing individual users with their MinIO credentials
    for the remaining endpoints.
    """
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


@users_blueprint.route("/api/users/<path:username>", methods=["GET"])
@login_required
def get_user(username: str) -> Response:
    """
    Retrieve information for one user. Administrators can read all users; regular
    users can only read themselves to retrieve MinIO credentials.
    """
    if (
        not app.config.get("LOGIN_DISABLED")
        and not current_user.is_admin
        and username != current_user.username
    ):
        abort(403)

    app.logger.debug("Querying database..")
    user = (
        models.User.query.options(joinedload(models.User.groups))
        .filter(models.User.username == username)
        .first_or_404()
    )
    app.logger.debug("Success, returning JSON")
    return jsonify_user(user)


def safe_remove(user: models.User, minio_admin: MinioAdmin = None) -> None:
    """
    Remove the corresponding MinIO identity for this user from MinIO if it exists.
    """
    if user.minio_access_key:
        minio_admin = minio_admin or get_minio_admin()
        try:
            minio_admin.remove_user(user.minio_access_key)
        except RuntimeError as err:
            app.logger.warning(err.args[0], exc_info=True)


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


@users_blueprint.route("/api/users/<path:username>", methods=["POST"])
@login_required
@validate_json
def reset_minio_user(username: str) -> Response:
    """
    Regenerate MinIO credentials for this user. Administrators can do this for all
    users; regular users may do this for themselves.
    """
    if (
        not app.config.get("LOGIN_DISABLED")
        and not current_user.is_admin
        and username != current_user.username
    ):
        abort(403)

    app.logger.debug("Verifying username exists in database..")
    user = (
        models.User.query.options(joinedload(models.User.groups))
        .filter(models.User.username == username)
        .first_or_404()
    )
    # TODO: maybe rate limit this API because generating these is expensive
    app.logger.debug("Resetting minio credentials..")
    reset_minio_credentials(user)
    transaction_or_abort(db.session.commit)
    app.logger.debug("Success, returning JSON..")
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
@validate_json
def create_user() -> Response:
    """
    Creates a new user and assigns them to any permission groups specified.
    Administrator-only.
    """
    if type(request.json) is not dict:
        abort(400, description="Expected object")
    app.logger.debug(
        "Validating username: '%s', email: '%s', and password: '%s'",
        request.json.get("username"),
        request.json.get("email"),
        request.json.get("password"),
    )
    if not valid_strings(request.json, "username", "email", "password"):
        abort(400, description="Missing fields")
    if (
        len(request.json["username"]) > models.User.username.type.length
        or len(request.json["email"]) >= models.User.email.type.length
    ):
        app.logger.error(
            "Username is longer than %s characters OR e-mail is longer than %s characters",
            models.User.username.type.length,
            models.User.email.type.length,
        )
        abort(400, description="Username or email too long")
    if not verify_email(request.json["email"]):
        app.logger.error("Email is not valid")
        abort(400, description="Bad email")

    app.logger.debug(
        "Checking whether supplied username or email is found in the database."
    )
    user = models.User.query.filter(
        (models.User.username == request.json["username"])
        | (models.User.email == request.json["email"])
    ).first()
    if user is not None:
        if user.username == request.json["username"]:
            msg = "User already exists"
        else:
            msg = "Email already in use"
        return (
            jsonify({"error": msg}),
            422,
            {"location": f"/api/users/{quote(user.username)}"},
        )

    app.logger.debug(
        "User is not found in database through username or email, begin adding user."
    )
    user = models.User(
        username=request.json["username"],
        email=request.json["email"],
        is_admin=request.json.get("is_admin"),
    )
    app.logger.debug("Setting password to user..")
    user.set_password(request.json["password"])

    app.logger.debug("Retrieving requested groups.")
    requested_groups = request.json.get("groups")
    if requested_groups:
        app.logger.debug("Requested groups are '%s'", requested_groups)
        groups = models.Group.query.filter(
            models.Group.group_code.in_(requested_groups)
        ).all()

        if len(requested_groups) != len(groups):
            app.logger.error("The requested groups are invalid.")
            abort(404, description="Invalid group code provided")
        user.groups += groups
    app.logger.debug(
        "Resetting minio credentials for user and adding user to database.."
    )
    reset_minio_credentials(user)
    db.session.add(user)
    transaction_or_abort(db.session.commit)
    app.logger.debug("Success, returning JSON.")
    return (
        jsonify_user(user),
        201,
        {"location": f"/api/users/{quote(user.username)}"},
    )


@users_blueprint.route("/api/users/<path:username>", methods=["DELETE"])
@login_required
@check_admin
def delete_user(username: str) -> Response:
    """
    Removes the user and their MinIO credentials if they are not a foreign key in
    the database. Administrator-only.
    """
    app.logger.debug("Checking whether requested username '%s' exists", username)
    user = models.User.query.filter_by(username=username).first_or_404()
    if (
        not app.config.get("LOGIN_DISABLED")
        and current_user.is_admin
        and user == current_user
    ):
        abort(422, description="Admin cannot delete self")

    try:
        app.logger.debug("Deleting user..")
        db.session.delete(user)
        db.session.commit()
    except:
        app.logger.exception("Error in deleting user")
        db.session.rollback()
        # Assume user foreign key required elsewhere and not other error
        abort(422, description="This user can only be deactivated")

    safe_remove(user)
    app.logger.debug("Success")

    return jsonify(), 204


@users_blueprint.route("/api/users/<string:username>", methods=["PATCH"])
@login_required
@validate_json
def update_user(username: str) -> Response:
    """
    Administrator-only: change the username, admin status, activation status,
    group membership, email, or password for a user.

    Regular users may only change their own password.
    """
    if type(request.json) is not dict:
        abort(400, description="Expected object")
    if app.config.get("LOGIN_DISABLED") or current_user.is_admin:
        app.logger.debug("User is admin")
        minio_admin = get_minio_admin()
        app.logger.debug("Retrieving username..")
        user = (
            models.User.query.filter_by(username=username)
            .options(joinedload(models.User.groups))
            .first_or_404()
        )
        app.logger.debug("Storing username")
        old_username = user.username

        app.logger.debug("Retrieving requested groups.")
        requested_groups = request.json.get("groups")
        if requested_groups is not None:  # TODO: list is assumed here
            app.logger.debug("Requested groups are '%s'", requested_groups)
            groups = models.Group.query.filter(
                models.Group.group_code.in_(requested_groups)
            ).all()
            if len(requested_groups) != len(groups):
                app.logger.error("The requested groups are invalid.")
                abort(404, description="Invalid group code provided")
            if user.minio_access_key:
                for group in user.groups:
                    app.logger.debug("Reset current group memberships")
                    # Reset existing group memberships
                    minio_admin.group_remove(group.group_code, user.minio_access_key)

                for group_code in requested_groups:
                    app.logger.debug("Adding membership to requested groups")
                    # Add to group
                    minio_admin.group_add(group_code, user.minio_access_key)
                    # Reset policy for group in case the group did not exist
                    minio_admin.set_policy(group_code, group=group_code)
            user.groups = groups

        app.logger.debug(
            "Validating username: '%s', email: '%s', and password: '%s'",
            request.json.get("username"),
            request.json.get("email"),
            request.json.get("password"),
        )
        if valid_strings(request.json, "username"):
            app.logger.debug("Username is valid, assigning..")
            user.username = request.json["username"]
        if valid_strings(request.json, "email") and verify_email(request.json["email"]):
            app.logger.debug("Email is valid, assigning")
            user.email = request.json["email"]
        if validate(request.json, "is_admin", kind=bool):
            app.logger.debug("User is admin, assigning..")
            user.is_admin = request.json["is_admin"]
        if validate(request.json, "deactivated", kind=bool):
            app.logger.debug("User is to be deactivated, deactivating..")
            user.deactivated = request.json["deactivated"]
            if user.deactivated and user.minio_access_key:
                safe_remove(user, minio_admin)
                user.minio_access_key = None
                user.minio_secret_key = None
        if valid_strings(request.json, "password"):
            app.logger.debug("Password is valid, assigning..")
            user.set_password(request.json["password"])
        app.logger.debug("Committing changes to the database..")
        transaction_or_abort(db.session.commit)
        app.logger.debug("Success")
        if old_username != user.username:
            return jsonify_user(user), {
                "location": f"/api/users/{quote(user.username)}"
            }
        else:
            return jsonify_user(user)

    # Update the current user's password given the existing password
    elif username == current_user.username:
        app.logger.debug("Updating password for user '%s'", current_user.username)
        if "current" not in request.json or "password" not in request.json:
            app.logger.error("Current or new password not supplied")
            abort(400, description="Bad request")
        if not current_user.check_password(request.json["current"]):
            app.logger.error("Invalid current password")
            abort(401, description="Incorrect password")
        app.logger.debug("Assigning new password..")
        current_user.set_password(request.json["password"])
        try:
            db.session.commit()
            app.logger.debug("Password successfully updated")
            return "Updated", 204
        except:
            app.logger.exception("Password unable to be updated")
            db.session.rollback()
            abort(500)

    else:
        app.logger.error("Request unable to be processed.")
        abort(403)
