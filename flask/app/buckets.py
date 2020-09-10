from app import app
from flask import request, json, jsonify
from minio import Minio
from minio.error import ResponseError

minioClient = Minio(app.config.get('MINIO_ENDPOINT'),
                    access_key = app.config.get('MINIO_ACCESS_KEY'),
                    secret_key = app.config.get('MINIO_SECRET_KEY'),
                     secure = False)


# display all objects, in buckets
@app.route('/api/objects', methods = ["GET"])
def get_object_info():
    all_objects = []

    bucket_names = [bucket.name for bucket in minioClient.list_buckets()]

    for bucket_name in bucket_names:
        bucket_objects = minioClient.list_objects(bucket_name)
        for obj in bucket_objects:
            object_dict = obj.__dict__
            all_objects.append({'bucket_name': object_dict['bucket_name'],
                                'object_name': object_dict['object_name'],
                                'owner_name': object_dict['owner_name'],
                                'size': round(object_dict['size'] * 1e-6, 3),
                                'etag': object_dict['etag'],
                                'last_modified': (object_dict['last_modified'])})

    return jsonify(all_objects)

