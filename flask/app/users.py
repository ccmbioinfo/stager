from flask import current_app as app, jsonify
from flask_login import login_required
from sqlalchemy.orm import joinedload

from . import models
from .routes import check_admin


@app.route("/api/users", methods=["GET"])
@login_required
@check_admin
def list_users():
    users = models.User.query.options(joinedload(models.User.groups)).all()
    return jsonify(
        [
            {
                "username": user.username,
                "email": user.email,
                "is_admin": user.is_admin,
                "last_login": user.last_login,
                "deactivated": user.deactivated,
                "groups": [group.group_code for group in user.groups],
            }
            for user in users
        ]
    )
