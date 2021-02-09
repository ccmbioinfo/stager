from flask import Blueprint, jsonify
from werkzeug.exceptions import HTTPException

error_blueprint = Blueprint("error_handler", __name__)


@error_blueprint.app_errorhandler(Exception)
def handle_error(error: Exception):
    code = 500  # defaults to 500 for non HTTP exceptions
    msg = error
    if isinstance(error, HTTPException):
        code = error.code
        msg = error.description
    return jsonify(error=str(msg)), code
