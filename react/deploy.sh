#!/usr/bin/env bash

# Copies webpack build/ to the destination S3 bucket via mc and removes old files

set -euo pipefail

MINIO_HOST_ALIAS=$1
DEPLOY_BUCKET=$2

# Collect file names from previous deployment, in deterministic order
mc find $MINIO_HOST_ALIAS/$DEPLOY_BUCKET | sed "s/^$MINIO_HOST_ALIAS\/$DEPLOY_BUCKET\///" | sort > old.out
# sed prunes the bucket prefix for the comparison later

# Collect file names to be deployed, in deterministic order
echo "$(cd build && find . -type f | sed 's/^\.\///' | sort)" > new.out
# sed prunes the "./" prefix from find

# Copy webpack bundles first and assign maximum cache expiration time
mc cp --recursive --attr 'Cache-Control=public, max-age=31536000, immutable' build/static/ $MINIO_HOST_ALIAS/$DEPLOY_BUCKET/static/
# Copy remaining files in the root that could change variably to minimize site downtime
mc cp --attr 'Cache-Control=no-cache' build/* $MINIO_HOST_ALIAS/$DEPLOY_BUCKET

# Find the object names of files that are not part of the current deployment on the remote and delete them
comm -23 old.out new.out | sed "s/^/$MINIO_HOST_ALIAS\/$DEPLOY_BUCKET\//" | mc rm --force --stdin
# sed adds the bucket prefix for mc

rm old.out new.out
