from flask import request, json, jsonify, current_app as app
from flask_login import login_user, logout_user, current_user, login_required
from minio import Minio
from minio.error import ResponseError


from . import db, login, models, routes
from sqlalchemy import exc
from sqlalchemy.orm import aliased, joinedload

minioClient = Minio(
    app.config.get("MINIO_ENDPOINT"),
    access_key=app.config.get("MINIO_ACCESS_KEY"),
    secret_key=app.config.get("MINIO_SECRET_KEY"),
    secure=False,
)


# display all objects, in buckets
@app.route("/api/objects", methods=["GET"])
def get_object_info():
    all_objects = []

    bucket_names = [bucket.name for bucket in minioClient.list_buckets()]

    for bucket_name in bucket_names:
        bucket_objects = minioClient.list_objects(bucket_name)
        for obj in bucket_objects:
            object_dict = obj.__dict__
            all_objects.append(
                {
                    "bucket_name": object_dict["bucket_name"],
                    "object_name": object_dict["object_name"],
                    "owner_name": object_dict["owner_name"],
                    "size": round(object_dict["size"] * 1e-6, 3),
                    "etag": object_dict["etag"],
                    "last_modified": (object_dict["last_modified"]),
                }
            )

    return jsonify(all_objects)


@app.route("/api/unlinked", methods=["GET"])
@login_required
def get_unlinked_files():

    # Get all minio bucket names
    all_bucket_names = [bucket.name for bucket in minioClient.list_buckets()]

    # Remove buckets the current user does not have access to assuming group_code.lower() == bucket name
    user = (
        db.session.query(models.User)
        .filter_by(user_id=current_user.user_id)
        .options(joinedload(models.User.groups))
        .first()
    )

    valid_bucket_names = []
    for group in user.groups:
        code = group.group_code.lower()
        if code in all_bucket_names:
            valid_bucket_names.append(code)

    # Get all files in valid minio buckets
    all_files = []
    for bucket in valid_bucket_names:
        objs = minioClient.list_objects(bucket)
        for obj in objs:
            all_files.append(obj.__dict__["object_name"])

    # Get all linked files
    linked_files = []
    for dataset in models.Dataset.query.all():
        if dataset.input_hpf_path is not None:
            linked_files.append(dataset.input_hpf_path)

    # Put all unlinked files in new list
    unlinked_files = []
    for file_name in all_files:
        if file_name not in linked_files:
            unlinked_files.append(file_name)

    return jsonify(unlinked_files)
