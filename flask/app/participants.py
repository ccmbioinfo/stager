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
