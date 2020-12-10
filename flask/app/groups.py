from flask import abort, jsonify, request, Response, current_app as app
from flask_login import login_user, logout_user, current_user, login_required
from app import db, login, models
from sqlalchemy.orm import contains_eager, joinedload
from .routes import check_admin, transaction_or_abort, mixin
from minio import Minio
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

    minio_admin = MinioAdmin(
        endpoint=app.config["MINIO_ENDPOINT"],
        access_key=app.config["MINIO_ACCESS_KEY"],
        secret_key=app.config["MINIO_SECRET_KEY"],
    )

    # Check if a user to be added doesn't exist, 404
    if "users" in request.json:
        users = models.User.query.filter(
            models.User.username.in_(request.json["users"])
        ).all()
        # Make sure all users are valid
        if len(users) != len(request.json["users"]):
            return "Invalid username provided", 404

        # Clear users from db and minio group
        if len(group.users) != 0:
            group_info = minio_admin.get_group(group_code)
            minio_admin.group_remove(group_code, *group_info["members"])
            group.users = []

        for user in users:
            # Add to db groups
            group.users.append(user)
            # Update/add them to the minio groups
            minio_admin.group_add(group_code, user.minio_access_key)
        # Reset policy for group in case the group did not exist
        minio_admin.set_policy(group_code, group=group_code)

    try:
        db.session.commit()
        return jsonify(group)
    except:
        db.session.rollback()
        return "Server error", 500


@app.route("/api/groups", methods=["POST"])
@login_required
@check_admin
def create_group():
    if not request.json:
        return "Request body must be JSON", 415

    group_name = request.json.get("group_name")
    group_code = request.json.get("group_code")

    if not group_name:
        return "A group display name must be provided", 400
    if not group_code:
        return "A group codename must be provided", 400

    if models.Group.query.filter(
        (models.Group.group_code == group_code)
        | (models.Group.group_name == group_name)
    ).value("group_id"):
        return "Group already exists", 422

    group_obj = models.Group(group_code=group_code, group_name=group_name)

    # Add users to the db if they were given
    if request.json.get("users"):
        users = models.User.query.filter(
            models.User.username.in_(request.json["users"])
        ).all()
        # Make sure all users are valid
        if len(users) != len(request.json["users"]):
            return "Invalid username provided", 404
        group_obj.users += users

    minio_client = Minio(
        app.config["MINIO_ENDPOINT"],
        access_key=app.config["MINIO_ACCESS_KEY"],
        secret_key=app.config["MINIO_SECRET_KEY"],
        secure=False,
    )

    minio_admin = MinioAdmin(
        endpoint=app.config["MINIO_ENDPOINT"],
        access_key=app.config["MINIO_ACCESS_KEY"],
        secret_key=app.config["MINIO_SECRET_KEY"],
    )

    # Create minio bucket via mc, 422 if it already exists
    if minio_client.bucket_exists(group_code):
        return "Minio bucket already exists", 422

    minio_client.make_bucket(group_code)
    # Make corresponding policy
    policy = readwrite_buckets_policy(group_code)
    minio_admin.add_policy(group_code, policy)

    # Add users to minio group if applicable, creating group as well
    if request.json.get("users"):
        for user in users:
            minio_admin.group_add(group_code, user.minio_access_key)

        # Set group access policy to the bucket by the same name
        minio_admin.set_policy(group_code, group=group_code)

    db.session.add(group_obj)
    transaction_or_abort(db.session.commit)

    location_header = "/api/groups/{}".format(group_obj.group_code)

    return request.json, 201, {"location": location_header}


@app.route("/api/groups/<string:group_code>", methods=["DELETE"])
@login_required
@check_admin
def delete_group(group_code):

    group = models.Group.query.filter_by(group_code=group_code).first_or_404()

    minio_admin = MinioAdmin(
        endpoint=app.config["MINIO_ENDPOINT"],
        access_key=app.config["MINIO_ACCESS_KEY"],
        secret_key=app.config["MINIO_SECRET_KEY"],
    )

    # Check group users in db
    if len(group.users) != 0:
        return "Group has users, cannot delete!", 422

    # Check group users in minio, in case it is somehow different from db
    if group_code in minio_admin.list_groups():
        group_info = minio_admin.get_group(group_code)
        if "members" in group_info:
            return "Group has users, cannot delete!", 422

    try:
        # Try deleting minio group as well
        db.session.delete(group)
        db.session.commit()
        minio_admin.group_remove(group_code)
        return "Deletion successful", 204
    except:
        db.session.rollback()
        return "Deletion of entity failed!", 422
