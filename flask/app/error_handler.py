import requests
import traceback
from flask import Blueprint, json, jsonify, request, current_app as app
from werkzeug.exceptions import HTTPException


error_blueprint = Blueprint("error_handler", __name__)


def send_error_notification(err_code: int, error: Exception):
    webhook_url = app.config.get("MSTEAMS_WEBHOOK_URL")
    if not webhook_url:
        return

    payload = {
        "title": f"Server error - {err_code}",
        "text": f"{str(request)}\n\n{str(error)}",
    }
    headers = {"Content-Type": "application/json"}

    try:
        requests.post(webhook_url, json=payload, headers=headers)
    except Exception as e:
        # can't really do anything about it, ignore...
        app.logger.error(
            f"Failed to post error notification on MS Teams webhook:\n{str(e)}"
        )


# dump relavant request info into a string
def get_request_info() -> str:
    info: str = "\n"
    info += f"{str(request)}\n"
    info += f"Query Params:\n{json.dumps(request.args.to_dict(), indent=4)}\n"
    if request.mimetype == "application/json":
        body = request.get_data(parse_form_data=True)
        try:
            info += f"Body:\n{json.dumps(json.loads(body), indent=4)}\n"
        except:
            info += "Failed to decode request body, ignoring..\n"

    return info


def dump_error_context(err_code: int, error: Exception) -> None:
    app.logger.error(get_request_info())
    app.logger.error(traceback.format_exc())
    send_error_notification(err_code, error)


@error_blueprint.app_errorhandler(Exception)
def handle_error(error: Exception):

    werkzeug_500_codes = [
        500,  # internal error
        501,  # not implemented
        502,  # bad gateway
        503,  # service unavailable
        504,  # gateway timeout
        505,  # http ver. not supported
    ]
    code = 500  # defaults to 500 for non HTTP exceptions
    msg = error

    if isinstance(error, HTTPException):
        code = error.code
        msg = error.description
        # 500 codes are handled as they all exist as a subclass of HTTPException
        if code in werkzeug_500_codes:
            dump_error_context(code, error)
    else:
        # this is useful for non-http exceptions as well
        dump_error_context(code, error)

    return jsonify(error=str(msg)), code
