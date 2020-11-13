#!/usr/bin/env bash

set -euo pipefail

PYTHON=${PYTHON:-python3}
COMMAND=${FLASK:-$PYTHON -m flask}
LC_ALL=C.UTF-8
LANG=C.UTF-8
FLASK_APP=app/__init__.py
if [[ "$1" == "pytest" ]]; then
    $PYTHON -m "$@"
elif [[ "$1" == "black" ]]; then
    "$@" *.py app migrations tests
elif [[ "$1" == "prod" ]]; then
    shift
    $COMMAND db upgrade
    gunicorn wsgi:app "$@"
else
    $COMMAND db upgrade
    $COMMAND add-default-admin
    $COMMAND add-dummy-data
    export FLASK_ENV=development
    $COMMAND run "$@"
fi
