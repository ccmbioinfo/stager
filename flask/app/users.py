import os

from flask import current_app as app, jsonify, request
from flask_login import current_user, login_required
from sqlalchemy.orm import joinedload

from . import db, models
from .routes import check_admin, transaction_or_abort
from .madmin import MinioAdmin


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


@app.route("/api/users/<string:username>", methods=["POST"])
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
    # TODO: maybe rate limit this API because generating these is expensive
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
    transaction_or_abort(db.session.commit)

    return jsonify({"minio_access_key": access_key, "minio_secret_key": secret_key})
