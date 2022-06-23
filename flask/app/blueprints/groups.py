from urllib.parse import quote

from flask import abort, jsonify, request, Response, Blueprint, current_app as app
from flask_login import login_required

from .. import models
from ..models import db
from ..madmin import stager_buckets_policy
from ..schemas import GroupSchema
from ..utils import (
    check_admin,
    get_current_user,
    get_minio_admin,
    get_minio_client,
    transaction_or_abort,
    validate_json,
    validate_filter_input,
)


groups_blueprint = Blueprint(
    "groups",
    __name__,
)

group_schema = GroupSchema()


@groups_blueprint.route("/api/groups", methods=["GET"], strict_slashes=False)
@login_required
def list_groups() -> Response:
    """
    Enumerates all permission groups visible to the current user. Administrators
    can see all groups; regular users can see groups that they are a member of.
    """
    user = get_current_user()

    if user.is_admin:
        app.logger.debug("Querying all groups..")
        groups = models.Group.query.all()
    else:
        app.logger.debug("Querying based on group membership..")
        groups = (
            models.Group.query.join(models.Group.users)
            .filter(models.User.user_id == user.user_id)
            .all()
        )

    app.logger.debug("Query successful; returning JSON..")

    return jsonify(
        [
            {"group_code": group.group_code, "group_name": group.group_name}
            for group in groups
        ]
    )


@groups_blueprint.route("/api/groups/<string:group_code>", methods=["GET"])
@login_required
def get_group(group_code) -> Response:
    """
    Enumerate all activated users in a group and retrieve group metadata. Administrators
    can read all groups; regular users can only read groups that they are a member of.
    """
    user = get_current_user()

    if user.is_admin:
        app.logger.debug("Querying based on group membership..")
        app.logger.debug("Querying all groups..")
        group = models.Group.query.filter(
            models.Group.group_code == group_code
        ).first_or_404()
    else:
        group = (
            models.Group.query.filter(models.Group.group_code == group_code)
            .join(models.Group.users)
            .filter(models.User.user_id == user.user_id)
            .first_or_404()
        )

    app.logger.debug("Query successful; returning JSON..")

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
def update_group(group_code) -> Response:
    """
    Change the display name or user membership of a group. Both request body fields
    are optional and they will only be changed if provided. Administrator-only.

    Potential problems: MinIO operations failing result in an inconsistent state.
    """

    if type(request.json) is not dict:
        abort(400, description="Expected object")

    app.logger.debug("Getting new group users, if any..")
    strlist_users = (
        request.json.get("users")  # Ignores the empty list
        and type(request.json["users"]) is list
        and all([type(user) is str for user in request.json["users"]])
    )

    if "users" in request.json and not strlist_users:
        abort(400, description="users should be a string array")

    app.logger.debug(f"Querying for group '{group_code}'..")

    group = models.Group.query.filter_by(group_code=group_code).first_or_404()

    if request.json.get("group_name"):
        app.logger.debug(
            "Checking if display name '%s' is in use..", request.json["group_name"]
        )
        conflicting_group = models.Group.query.filter_by(
            group_name=request.json["group_name"]
        ).one_or_none()
        if (conflicting_group is not None) and (conflicting_group != group):
            abort(422, description="Group name in use")
        group.group_name = request.json["group_name"]

    minio_admin = get_minio_admin()

    if strlist_users:
        app.logger.debug("Checking if users to be added exist..")
        users = models.User.query.filter(
            models.User.username.in_(request.json["users"])
        ).all()
        # Make sure all users are valid
        if len(users) != len(request.json["users"]):
            abort(404, description="Invalid username provided")

        app.logger.debug("Clearing users from db and minio group..")
        if len(group.users) != 0:
            group_info = minio_admin.get_group(group_code)
            minio_admin.group_remove(group_code, *group_info["members"])
            group.users = []

        app.logger.debug("Adding users to group..")
        for user in users:
            # Add to db groups
            group.users.append(user)
            # Update/add them to the minio groups
            minio_admin.group_add(group_code, user.minio_access_key)
        # Reset policy for group in case the group did not exist
        minio_admin.set_policy(group_code, group=group_code)

    transaction_or_abort(db.session.commit)
    app.logger.debug("Changes successful; returning JSON..")
    return jsonify(group)


@groups_blueprint.route("/api/groups", methods=["POST"], strict_slashes=False)
@login_required
@check_admin
@validate_json
def create_group():
    """
    Create a new permission group. Administrator-only.

    Potential problems: MinIO operations failing result in an inconsistent state.
    """

    if type(request.json) is not dict:
        abort(400, description="Expected object")

    new_group = validate_filter_input(request.json, models.Group)
    result = group_schema.validate(new_group, session=db.session)
    if result:
        app.logger.error(result)
        abort(400, description=result)

    group_name = request.json.get("group_name")
    group_code = request.json.get("group_code")

    app.logger.debug("Getting new group users, if any..")
    strlist_users = (
        request.json.get("users")  # Ignores the empty list
        and type(request.json["users"]) is list
        and all([type(user) is str for user in request.json["users"]])
    )
    if "users" in request.json and not strlist_users:
        abort(400, description="users should be a string array")

    app.logger.debug("Checking if group already exists..")
    if (
        db.session.query(models.Group.group_id)
        .filter(
            (models.Group.group_code == group_code)
            | (models.Group.group_name == group_name)
        )
        .scalar()
    ):
        abort(422, description="Group already exists")

    minio_client = get_minio_client()
    minio_admin = get_minio_admin()

    def make_bucket_or_fail(name: str) -> None:
        app.logger.info(f"Creating MinIO bucket '{name}'..")
        if minio_client.bucket_exists(name):
            abort(422, description=f"MinIO bucket '{name}' already exists")
        minio_client.make_bucket(
            bucket_name=name, location=app.config["MINIO_REGION_NAME"]
        )

    try:
        make_bucket_or_fail(group_code)
        make_bucket_or_fail(f"results-{group_code}")
    except:
        abort(422, description="Invalid bucket name")

    group = models.Group(group_code=group_code, group_name=group_name)

    # Add users to the db if they were given
    if strlist_users:
        app.logger.debug("Checking if users to be added exist..")
        users = models.User.query.filter(
            models.User.username.in_(request.json["users"])
        ).all()
        # Make sure all users are valid
        if len(users) != len(request.json["users"]):
            abort(404, description="Invalid username provided")
        group.users += users

    app.logger.debug("Adding minio policy for group..")

    # Make corresponding policy
    policy = stager_buckets_policy(group_code)
    minio_admin.add_policy(group_code, policy)

    # Add users to minio group if applicable, creating group as well
    if strlist_users:
        app.logger.debug("Adding users to minio group..")
        for user in users:
            minio_admin.group_add(group_code, user.minio_access_key)

        # Set group access policy to the bucket by the same name
        minio_admin.set_policy(group_code, group=group_code)

    db.session.add(group)
    transaction_or_abort(db.session.commit)

    app.logger.debug("Group created successfully; returning JSON..")

    return (
        jsonify(request.json),
        201,
        {"location": f"/api/groups/{quote(group.group_code)}"},
    )


@groups_blueprint.route("/api/groups/<string:group_code>", methods=["DELETE"])
@login_required
@check_admin
def delete_group(group_code):
    """
    If the permission group is empty, removes the permission group, but retains
    the MinIO bucket. Administrator-only.
    """
    app.logger.debug(f"Checking if group '{group_code}' exists..")
    group = models.Group.query.filter_by(group_code=group_code).first_or_404()

    minio_admin = get_minio_admin()

    app.logger.debug(f"Checking if group '{group_code}' has users..")
    if len(group.users) != 0:
        abort(422, description="Group has users, cannot delete!")

    # Check group users in minio, in case it is somehow different from db
    app.logger.debug(f"Checking if group '{group_code}' has users in MinIO..")
    if group_code in minio_admin.list_groups():
        group_info = minio_admin.get_group(group_code)
        if "members" in group_info:
            app.logger.warn(
                f"Group {group_code} has members in MinIO but not the database"
            )
            abort(422, description="Group has users, cannot delete!")

    try:
        app.logger.debug(f"Deleting group {group_code}..")
        db.session.delete(group)
        db.session.commit()
    except:
        app.logger.exception(f"Could not delete permission group {group_code}!")
        db.session.rollback()
        abort(422, description="Deletion of entity failed!")

    try:
        app.logger.debug(f"Deleting group {group_code} from MinIO..")
        minio_admin.group_remove(group_code)
        minio_admin.remove_policy(group_code)
    except:
        app.logger.exception(f"Removing MinIO group {group_code}")
    finally:
        return "Deletion successful", 204
