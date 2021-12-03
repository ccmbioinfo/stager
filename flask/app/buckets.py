from flask import jsonify, Blueprint, current_app as app
from flask_login import current_user, login_required
from sqlalchemy.orm import joinedload
from sqlalchemy import or_

from . import models
from .utils import get_minio_client


bucket_blueprint = Blueprint(
    "buckets",
    __name__,
)


@bucket_blueprint.route("/api/unlinked/<prefix>", methods=["GET"])
@login_required
def get_unlinked_files(prefix: str):

    app.logger.debug('this is prefix backend', prefix)

    minio_client = get_minio_client()

    app.logger.debug("Getting all minio bucket names..")
    all_bucket_names = [bucket.name for bucket in minio_client.list_buckets()]
    app.logger.debug("All bucket names", all_bucket_names)

    # Remove buckets the current user does not have access to assuming group_code.lower() == bucket name
    app.logger.debug("Getting all buckets that user has access to..")
    user = (
        models.User.query.filter_by(user_id=current_user.user_id)
        .options(joinedload(models.User.groups))
        .first()
    )

    valid_bucket_names = []
    for group in user.groups:
        code = group.group_code.lower()
        if code in all_bucket_names:
            valid_bucket_names.append(code)

    app.logger.debug("Getting all files in valid minio buckets..")
    all_files = []
    for bucket in valid_bucket_names:
        app.logger.debug("each bucket", bucket, prefix)
        objs = minio_client.list_objects(bucket, prefix=prefix, recursive=True)
        for obj in objs:
            all_files.append(bucket + "/" + obj.object_name)

    app.logger.debug("Getting all linked files..")

    files = []

    linked_files = {
        f.path: True
        for f in models.File.query.filter(
            or_(models.File.multiplexed == None,
                models.File.multiplexed == False)
        ).all()
    }

    linkable_files = {
        f.path: True
        for f in models.File.query.filter(models.File.multiplexed == True).all()
    }

    for file_name in all_files:
        if linkable_files.get(file_name):
            files.append({"path": file_name, "multiplexed": True})
        elif not linked_files.get(file_name):
            files.append({"path": file_name, "multiplexed": False})

    app.logger.debug("Returning JSON array with prefix..")
    app.logger.debug(files)

    return jsonify(sorted(files, key=lambda f: f["path"]))


@bucket_blueprint.route("/api/unlinked", methods=["GET"])
@login_required
def get_unlinked_files_no_prefix():

    minio_client = get_minio_client()

    app.logger.debug("Getting all minio bucket names..")
    all_bucket_names = [bucket.name for bucket in minio_client.list_buckets()]

    # Remove buckets the current user does not have access to assuming group_code.lower() == bucket name
    app.logger.debug("Getting all buckets that user has access to..")
    user = (
        models.User.query.filter_by(user_id=current_user.user_id)
        .options(joinedload(models.User.groups))
        .first()
    )

    valid_bucket_names = []
    for group in user.groups:
        code = group.group_code.lower()
        if code in all_bucket_names:
            valid_bucket_names.append(code)

    app.logger.debug("Getting all files in valid minio buckets..")
    all_files = []
    for bucket in valid_bucket_names:
        objs = minio_client.list_objects(bucket, recursive=True)
        for obj in objs:
            all_files.append(bucket + "/" + obj.object_name)

    app.logger.debug("Getting all linked files..")

    files = []

    linked_files = {
        f.path: True
        for f in models.File.query.filter(
            or_(models.File.multiplexed == None,
                models.File.multiplexed == False)
        ).all()
    }

    linkable_files = {
        f.path: True
        for f in models.File.query.filter(models.File.multiplexed == True).all()
    }

    for file_name in all_files:
        if linkable_files.get(file_name):
            files.append({"path": file_name, "multiplexed": True})
        elif not linked_files.get(file_name):
            files.append({"path": file_name, "multiplexed": False})

    app.logger.debug("Returning JSON array without prefix..")

    return jsonify(sorted(files, key=lambda f: f["path"]))
