from functools import wraps
from typing import Any
from logging import error
from flask import request, abort


def validate_json(Validator: Any = None):
    """ HOF that returns a decorator with optional Validator object (currently not implemented) """
    def wrapper(f):
        @wraps(f)
        def validate(*args, **kwargs):
            """ validate content-type header and run optional Validator on input """
            if request.headers.get('Content-Type') != 'application/json':
                error("Content-Type is not application/json")
                abort(415, description="Content-Type must be application/json")
            return f(*args, **kwargs)
        return validate
    return wrapper
