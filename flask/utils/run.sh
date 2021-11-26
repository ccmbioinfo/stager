#!/usr/bin/env bash

set -euo pipefail

PYTHON=${PYTHON:-python3}
COMMAND=${FLASK:-$PYTHON -m flask}
LC_ALL=C.UTF-8
LANG=C.UTF-8
FLASK_APP=app/__init__.py
if [[ "$1" == "pytest" ]]; then
    exec $PYTHON -m "$@"
elif [[ "$1" == "black" ]]; then
    exec "$@" *.py app migrations tests
elif [[ "$1" == "prod" ]]; then
    shift
    $COMMAND db upgrade
    exec gunicorn wsgi:app "$@"
else
    if [ ! -d "migrations" ]; then
        $COMMAND db init
        $COMMAND db migrate -m "Initial migration."
    fi
    $COMMAND db upgrade
    $COMMAND db-seed-dev
    exec $COMMAND run "$@"
fi
