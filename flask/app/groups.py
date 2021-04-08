from flask import abort, jsonify, request, Response, Blueprint, current_app as app
from flask_login import login_user, logout_user, current_user, login_required
from .extensions import db, login
from . import models
from sqlalchemy.orm import contains_eager, joinedload
from .utils import check_admin, transaction_or_abort, mixin, validate_json

from minio import Minio
from .madmin import MinioAdmin, stager_buckets_policy


groups_blueprint = Blueprint(
    "groups",
    __name__,
)


@groups_blueprint.route("/api/groups", methods=["GET"])
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


@groups_blueprint.route("/api/groups/<string:group_code>", methods=["GET"])
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
        abort(403, description="Forbidden")

    return jsonify(
        {
            "group_code": group.group_code,
            "group_name": group.group_name,
            "users": [
                user.username for user in group.users if user.deactivated == False
            ],
        }
    )


@groups_blueprint.route("/api/groups/<string:group_code>", methods=["PATCH"])
@login_required
@check_admin
@validate_json
def update_group(group_code):

    group = models.Group.query.filter_by(group_code=group_code).first_or_404()

    if "group_name" in request.json:
        if request.json["group_name"]:
            # Check if display name is in use, 422
            conflicting_group = models.Group.query.filter_by(
                group_name=request.json["group_name"]
            ).one_or_none()
            if (conflicting_group is not None) and (conflicting_group != group):
                abort(422, description="Group name in use")
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
            abort(404, description="Invalid username provided")

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
        abort(500)


@groups_blueprint.route("/api/groups", methods=["POST"])
@login_required
@check_admin
@validate_json
def create_group():

    group_name = request.json.get("group_name")
    group_code = request.json.get("group_code")

    if not group_name:
        abort(400, description="A group display name must be provided")
    if not group_code:
        abort(400, description="A group codename must be provided")

    if (
        db.session.query(models.Group.group_id)
        .filter(
            (models.Group.group_code == group_code)
            | (models.Group.group_name == group_name)
        )
        .scalar()
    ):
        abort(422, description="Group already exists")

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

    try:
        # Create minio bucket via mc, 422 if it already exists
        if minio_client.bucket_exists(group_code):
            abort(422, description="Minio bucket already exists")
        minio_client.make_bucket(group_code)
    except:
        abort(422, description="Invalid bucket name")

    group_obj = models.Group(group_code=group_code, group_name=group_name)

    # Add users to the db if they were given
    if request.json.get("users"):
        users = models.User.query.filter(
            models.User.username.in_(request.json["users"])
        ).all()
        # Make sure all users are valid
        if len(users) != len(request.json["users"]):
            abort(404, description="Invalid username provided")
        group_obj.users += users

    # Make corresponding policy
    policy = stager_buckets_policy(group_code)
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


@groups_blueprint.route("/api/groups/<string:group_code>", methods=["DELETE"])
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
        abort(422, description="Group has users, cannot delete!")

    # Check group users in minio, in case it is somehow different from db
    if group_code in minio_admin.list_groups():
        group_info = minio_admin.get_group(group_code)
        if "members" in group_info:
            abort(422, description="Group has users, cannot delete!")

    try:
        # Try deleting minio group as well
        db.session.delete(group)
        db.session.commit()
    except:
        db.session.rollback()
        abort(422, description="Deletion of entity failed!")

    try:
        minio_admin.group_remove(group_code)
    finally:
        return "Deletion successful", 204
