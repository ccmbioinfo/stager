#!/usr/bin/env bash

set -euo pipefail

PYTHON=${PYTHON:-python3}
COMMAND=${FLASK:-$PYTHON -m flask}
LC_ALL=C.UTF-8
LANG=C.UTF-8
FLASK_APP=app/__init__.py
$COMMAND db upgrade
$COMMAND add-default-admin
$COMMAND add-dummy-data
if [[ "$1" == "prod" ]]; then
    shift
    gunicorn wsgi:app "$@"
else
    export FLASK_ENV=development
    $COMMAND run "$@"
fi
