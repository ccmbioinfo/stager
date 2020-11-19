from datetime import datetime
import json
from typing import Any, Callable, Dict, List, Union
from dataclasses import asdict

from . import db, login, models, routes

from flask import abort, jsonify, request, Response, current_app as app
from flask_login import login_user, logout_user, current_user, login_required
from sqlalchemy import exc
from sqlalchemy.orm import aliased, joinedload
from werkzeug.exceptions import HTTPException


editable_columns = [
    "participant_codename",
    "sex",
    "participant_type",
    "affected",
    "month_of_birth",
    "solved",
    "notes",
]


@app.route("/api/participants", methods=["GET"], endpoint="participants_list")
@login_required
def participants_list():
    db_participants = models.Participant.query.options(
        joinedload(models.Participant.family),
        joinedload(models.Participant.tissue_samples).joinedload(
            models.TissueSample.datasets
        ),
    ).all()

    participants = [
        {
            **asdict(participant),
            "family_codename": participant.family.family_codename,
            "tissue_samples": [
                {**asdict(tissue_sample), "datasets": tissue_sample.datasets}
                for tissue_sample in participant.tissue_samples
            ],
        }
        for participant in db_participants
    ]
    return jsonify(participants)


@app.route("/api/participants/<int:id>", methods=["DELETE"])
@login_required
@routes.check_admin
def delete_participant(id: int):
    participant = (
        models.Participant.query.filter(models.Participant.participant_id == id)
        .options(joinedload(models.Participant.tissue_samples))
        .one_or_none()
    )
    if participant and not participant.tissue_samples:
        try:
            db.session.delete(participant)
            db.session.commit()
            return "Updated", 204
        except:
            db.session.rollback()
            return "Server error", 500
    elif participant:
        return "Participant has tissue samples, cannot delete", 422
    else:
        return "Not Found", 404


@app.route("/api/participants/<int:id>", methods=["PATCH"])
@login_required
def update_participant(id: int):

    if not request.json:
        return "Request body must be JSON", 415

    table = models.Participant.query.get_or_404(id)

    enum_error = routes.mixin(table, request.json, editable_columns)

    if enum_error:
        return enum_error, 400

    try:
        table.updated_by = current_user.user_id
    except:
        pass  # LOGIN_DISABLED

    routes.transaction_or_abort(db.session.commit)

    return jsonify(table)


@app.route("/api/participants", methods=["POST"])
@login_required
def create_participant():

    if not request.json:
        return "Request body must be JSON", 400

    try:
        updated_by = current_user.user_id
        created_by = current_user.user_id
    except:  # LOGIN_DISABLED
        updated_by = 1
        created_by = 1

    # check if the participant exists under a given family

    ptp_query = models.Participant.query.filter(
        models.Participant.family_id == request.json.get("family_id"),
        models.Participant.participant_codename
        == request.json.get("participant_codename"),
    )

    if ptp_query.first() is not None:
        return "Participant codename already exists under family", 422

    # check if family exists
    models.Family.query.filter(
        models.Family.family_id == request.json.get("family_id")
    ).first_or_404()

    # validate enums
    enum_error = routes.enum_validate(
        models.Participant, request.json, editable_columns
    )

    if enum_error:
        return enum_error, 400

    ptp_objs = models.Participant(
        family_id=request.json.get("family_id"),
        participant_codename=request.json.get("participant_codename"),
        sex=request.json.get("sex"),
        notes=request.json.get("notes"),
        affected=request.json.get("affected"),
        solved=request.json.get("solved"),
        participant_type=request.json.get("participant_type"),
        month_of_birth=request.json.get("month_of_birth"),
        created_by=created_by,
        updated_by=updated_by,
    )

    db.session.add(ptp_objs)
    routes.transaction_or_abort(db.session.commit)

    location_header = "/api/participants/{}".format(ptp_objs.participant_id)

    return jsonify(ptp_objs), 201, {"location": location_header}
