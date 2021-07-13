from flask import Blueprint, jsonify, current_app as app
from werkzeug.exceptions import HTTPException
import traceback

error_blueprint = Blueprint("error_handler", __name__)


@error_blueprint.app_errorhandler(Exception)
def handle_error(error: Exception):
    code = 500  # defaults to 500 for non HTTP exceptions
    msg = error
    if isinstance(error, HTTPException):
        code = error.code
        msg = error.description
        app.logger.error(traceback.format_exc())
    return jsonify(error=str(msg)), code
