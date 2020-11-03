from dataclasses import asdict

from flask import abort, jsonify, request, Response, current_app as app
from flask_login import login_user, logout_user, current_user, login_required
from app import db, login, models
from sqlalchemy.orm import joinedload


@app.route("/api/families", methods = ["GET"])
@login_required
def families_list():

    db_families = models.Family.query.options(
        joinedload(models.Family.participants)
    ).all()

    families = [
        { 
            **asdict(family),
            "participants": [
                        {
                            **asdict(participants)
                        }
                    for participants in family.participants
                ]
            }
        for family in db_families
    ]

    return jsonify(families)
