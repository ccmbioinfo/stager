from flask import abort, jsonify, Blueprint, current_app as app, request
from flask_login import current_user, login_required
from sqlalchemy.orm import joinedload
from sqlalchemy import or_

from . import models
from .utils import get_minio_client


bucket_blueprint = Blueprint(
    "buckets",
    __name__,
)


@bucket_blueprint.route("/api/unlinked", methods=["GET"])
@login_required
def get_unlinked_files():

    path = request.args.get("path", default="", type=str)

    files = []

    if path != "":
        filepath = path.split("/", 1)
        if len(filepath) < 2:
            abort(
                400,
                description="Please make sure your file path contains both folder and file name, such as c4r/folder1/folder2/filename",
            )

        bucket_name = filepath[0].strip()
        file_name = filepath[1].strip()

        minio_client = get_minio_client()

        # Check if the bucket in file path exists
        app.logger.debug("Getting all minio bucket names..")
        all_bucket_names = [
            bucket.name for bucket in minio_client.list_buckets()]
        if bucket_name not in all_bucket_names:
            abort(
                400, description=f"Bucket name must be one of {all_bucket_names}")

        app.logger.debug("Getting all buckets that user has access to..")
        user = (
            models.User.query.filter_by(user_id=current_user.user_id)
            .options(joinedload(models.User.groups))
            .first()
        )

        # Check if the user has access to the bucket, assuming group_code.lower() == bucket name
        valid_bucket_names = []
        for group in user.groups:
            code = group.group_code.lower()
            if code in all_bucket_names:
                valid_bucket_names.append(code)

        if bucket_name not in valid_bucket_names:
            abort(
                400, description=f"User does not have access to bucket {bucket_name}.")

        # Get files with prefix in the bucket user specifies
        app.logger.debug("Getting all files in user minio buckets..")
        all_files = []
        objs = minio_client.list_objects(
            bucket_name, prefix=file_name, recursive=True)
        for obj in objs:
            if obj.object_name == file_name:
                all_files.append(bucket_name + "/" + obj.object_name)

        app.logger.debug("Getting all linked files..")

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

        app.logger.debug(f"Returning JSON array with prefix {file_name}..")

        if len(files) == 0:
            abort(
                400,
                "There is no matching unlinked file. Please make sure that your file exists.",
            )

    return jsonify(sorted(files, key=lambda f: f["path"]))
