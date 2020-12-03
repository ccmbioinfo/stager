from flask import abort, jsonify, request, Response, current_app as app
from flask_login import login_user, logout_user, current_user, login_required
from app import db, login, models
from sqlalchemy.orm import contains_eager, joinedload
from .routes import check_admin, transaction_or_abort, mixin
from minio import  Minio
from os import environ
from .madmin import MinioAdmin, readwrite_buckets_policy

@app.route("/api/groups", methods=["GET"])
@login_required
def list_groups():
    if app.config.get("LOGIN_DISABLED") or current_user.is_admin:
        user_id = request.args.get("user")
    else:
        user_id = current_user.user_id

    if user_id:
        groups = (
            models.Group.query.join(models.Group.users)
            .filter(models.User.user_id == user_id)
            .all()
        )
    else:
        groups = models.Group.query.all()

    return jsonify(
        [
            {"group_code": group.group_code, "group_name": group.group_name}
            for group in groups
        ]
    )


@app.route("/api/groups/<string:group_code>", methods=["GET"])
@login_required
def get_group(group_code):
    if app.config.get("LOGIN_DISABLED") or current_user.is_admin:
        user_id = request.args.get("user")
    else:
        user_id = current_user.user_id

    if user_id:
        group = (
            models.Group.query.filter(models.Group.group_code == group_code)
            .join(models.Group.users)
            .filter(models.User.user_id == user_id)
            .one_or_none()
        )
    else:
        group = models.Group.query.filter(
            models.Group.group_code == group_code
        ).one_or_none()

    if group is None:
        return "Forbidden", 403

    return jsonify(
        {
            "group_code": group.group_code,
            "group_name": group.group_name,
            "users": [
                user.username for user in group.users if user.deactivated == False
            ],
        }
    )


@app.route("/api/groups/<string:group_code>", methods=["PATCH"])
@login_required
@check_admin
def update_group(group_code):

    if not request.json:
        return "Request body must be JSON", 415

    group = models.Group.query.filter_by(group_code=group_code).first_or_404()

    if "group_name" in request.json:
        if request.json["group_name"]:
            # Check if display name is in use, 422
            conflicting_group = models.Group.query.filter_by(
                group_name=request.json["group_name"]
            ).one_or_none()
            if (conflicting_group is not None) and (conflicting_group != group):
                return "Group name in use", 422
            group.group_name = request.json["group_name"]

    minioAdmin = MinioAdmin(
        endpoint=environ["MINIO_ENDPOINT"],
        access_key=environ["MINIO_ACCESS_KEY"],
        secret_key=environ["MINIO_SECRET_KEY"],
    )

    # Check if a user to be added doesn't exist, 404
    if "users" in request.json:
        if len(request.json["users"]) != 0:
            users = models.User.query.filter(
                models.User.username.in_(request.json["users"])
            ).all()
            # Make sure all users are valid
            if len(users) != len(request.json["users"]):
                return "Invalid username provided", 404

            # Clear users from db and minio group
            group.users[:] = []
            group_info = minioAdmin.get_group(group_code)
            for old_user in group_info["members"]:
                minioAdmin.group_remove(group_code, old_user)

            for user in users:
                # Add to db groups
                group.users.append(user)
                # Update/add them to the minio groups
                minioAdmin.group_add(group_code, user.minio_access_key)
            # Reset policy for group in case the group did not exist
            minioAdmin.set_policy(group_code, group=group_code)

    try:
        db.session.commit()
        return jsonify(group)
    except:
        db.session.rollback()
        return "Server error", 500
