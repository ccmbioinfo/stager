from datetime import datetime
from typing import Any, Callable, Dict, List, Union
from dataclasses import asdict

from .extensions import db, login
from . import models

from flask import abort, jsonify, request, Response, Blueprint, current_app as app
from flask_login import login_user, logout_user, current_user, login_required
from sqlalchemy import exc, asc, desc
from sqlalchemy.orm import aliased, contains_eager, joinedload
from werkzeug.exceptions import HTTPException

from .utils import (
    check_admin,
    transaction_or_abort,
    mixin,
    enum_validate,
    string_to_bool,
)


editable_columns = [
    "participant_codename",
    "sex",
    "participant_type",
    "affected",
    "month_of_birth",
    "solved",
    "notes",
]


participants_blueprint = Blueprint(
    "participants",
    __name__,
)


@participants_blueprint.route("/api/participants", methods=["GET"])
@login_required
def list_participants():

    # parsing query parameters
    limit = request.args.get("limit", default=10)
    page = request.args.get("page", default=0)
    order_by_col = request.args.get("order_by", default="participant_id", type=str)
    order_dir = request.args.get("order_dir", default="asc", type=str)
    # parsing filters to reduce overfetch
    participant_codename = request.args.get(
        "participant_codename", default=None, type=str
    )
    participant_codename = f"%{participant_codename}%" if participant_codename else "%"
    notes = request.args.get("notes", default=None, type=str)
    notes = f"%{notes}%" if notes else None
    participant_type = request.args.get(
        "participant_type", default="Proband,Parent,Sibling,Other", type=str
    ).split(",")
    sex = request.args.get("sex", default="Male,Female,Unknown,Other", type=str).split(
        ","
    )
    affected = request.args.get("affected", default=None, type=str)
    solved = request.args.get("solved", default=None, type=str)
    family_codename = request.args.get("family_codename", default=None, type=str)
    family_codename = f"%{family_codename}%" if family_codename else "%"
    dataset_type = request.args.get("dataset_type", default=None, type=str)

    # enum_error = enum_validate(models.Participant, request.json, editable_columns)
    # for some reason type=int doesn't catch non-integer queries
    try:
        int(limit)
    except:
        return "Limit must be a valid integer", 400

    try:
        int(page)
    except:
        return "Page must be a valid integer", 400

    offset = int(page) * int(limit)

    columns = models.Participant.__table__.columns.keys()

    try:
        order_column = getattr(models.Participant, order_by_col)
    except AttributeError:
        return f"Column name must be one of {columns}", 400

    try:
        order = getattr(order_column, order_dir)
    except AttributeError:
        return f"Column name must be 'asc' or 'desc'", 400

    if app.config.get("LOGIN_DISABLED") or current_user.is_admin:
        user_id = request.args.get("user")
    else:
        user_id = current_user.user_id

    if user_id:
        participants = models.Participant.query.options(
            joinedload(models.Participant.family),
            contains_eager(models.Participant.tissue_samples).contains_eager(
                models.TissueSample.datasets
            ),
        )
        participants = (
            participants.join(models.Participant.family)
            .join(models.TissueSample)
            .join(models.Dataset)
            .join(
                models.groups_datasets_table,
                models.Dataset.dataset_id
                == models.groups_datasets_table.columns.dataset_id,
            )
            .join(
                models.users_groups_table,
                models.groups_datasets_table.columns.group_id
                == models.users_groups_table.columns.group_id,
            )
            .filter(
                models.users_groups_table.columns.user_id == user_id,
                models.Participant.participant_codename.like(participant_codename),
                models.Family.family_codename.like(family_codename),
                models.Participant.participant_type.in_(participant_type),
                models.Participant.sex.in_(sex),
            )
        )

    else:
        participants = models.Participant.query.options(
            joinedload(models.Participant.family),
            joinedload(models.Participant.tissue_samples).joinedload(
                models.TissueSample.datasets
            ),
            joinedload(models.Participant.created_by),
            joinedload(models.Participant.updated_by),
        )

        participants = (
            participants.join(models.Family)
            .join(models.TissueSample)
            .join(models.Dataset)
            .filter(
                models.Participant.participant_codename.like(participant_codename),
                models.Family.family_codename.like(family_codename),
                models.Participant.participant_type.in_(participant_type),
                models.Participant.sex.in_(sex),
            )
        )

    if notes:
        if notes != "%null%":
            participants = participants.filter(models.Participant.notes.like(notes))
        else:
            participants = participants.filter(models.Participant.notes == None)
    if affected:
        # need conditional statements for nullable columns, otherwise null values filtered out
        if affected == "null":
            participants = participants.filter(models.Participant.affected == None)
        else:
            affected = string_to_bool(affected)
            participants = participants.filter(models.Participant.affected == affected)
    if solved:
        if solved.lower() == "null":
            participants = participants.filter(models.Participant.solved == None)
        else:
            solved = string_to_bool(solved)
            participants = participants.filter(models.Participant.solved == solved)
    if dataset_type:
        dataset_type = dataset_type.split(",")
        participants = participants.filter(
            models.Dataset.dataset_type.in_(dataset_type)
        )

    total_count = participants.count()
    participants = participants.order_by(order()).limit(limit).offset(offset)

    return jsonify(
        {
            "data": [
                {
                    **asdict(participant),
                    "family_codename": participant.family.family_codename,
                    "institution": participant.institution.institution
                    if participant.institution
                    else None,
                    "updated_by": participant.updated_by.username,
                    "created_by": participant.created_by.username,
                    "tissue_samples": [
                        {**asdict(tissue_sample), "datasets": tissue_sample.datasets}
                        for tissue_sample in participant.tissue_samples
                    ],
                }
                for participant in participants
            ],
            "page": int(page),
            "total_count": total_count,
        }
    )


@participants_blueprint.route("/api/participants/<int:id>", methods=["DELETE"])
@login_required
@check_admin
def delete_participant(id: int):
    participant = (
        models.Participant.query.filter(models.Participant.participant_id == id)
        .options(joinedload(models.Participant.tissue_samples))
        .first_or_404()
    )
    if not participant.tissue_samples:
        try:
            db.session.delete(participant)
            db.session.commit()
            return "Updated", 204
        except:
            db.session.rollback()
            return "Server error", 500
    else:
        return "Participant has tissue samples, cannot delete", 422


@participants_blueprint.route("/api/participants/<int:id>", methods=["PATCH"])
@login_required
def update_participant(id: int):

    if not request.json:
        return "Request body must be JSON", 415

    if app.config.get("LOGIN_DISABLED") or current_user.is_admin:
        user_id = request.args.get("user")
    else:
        user_id = current_user.user_id

    if user_id:
        participant = (
            models.Participant.query.filter(models.Participant.participant_id == id)
            .join(models.TissueSample)
            .join(models.Dataset)
            .join(
                models.groups_datasets_table,
                models.Dataset.dataset_id
                == models.groups_datasets_table.columns.dataset_id,
            )
            .join(
                models.users_groups_table,
                models.groups_datasets_table.columns.group_id
                == models.users_groups_table.columns.group_id,
            )
            .filter(models.users_groups_table.columns.user_id == user_id)
            .first_or_404()
        )
    else:
        participant = models.Participant.query.filter(
            models.Participant.participant_id == id
        ).first_or_404()

    enum_error = mixin(participant, request.json, editable_columns)

    if enum_error:
        return enum_error, 400

    if user_id:
        participant.updated_by_id = user_id

    transaction_or_abort(db.session.commit)

    return jsonify(
        [
            {
                **asdict(participant),
                "institution": participant.institution.institution
                if participant.institution
                else None,
                "created_by": participant.created_by.username,
                "updated_by": participant.updated_by.username,
            }
        ]
    )


@participants_blueprint.route("/api/participants", methods=["POST"])
@login_required
@check_admin
def create_participant():
    if not request.json:
        return "Request body must be JSON", 415

    try:
        updated_by_id = current_user.user_id
        created_by_id = current_user.user_id
    except:  # LOGIN_DISABLED
        updated_by_id = 1
        created_by_id = 1

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
    enum_error = enum_validate(models.Participant, request.json, editable_columns)

    if enum_error:
        return enum_error, 400

    # get institution id
    institution = request.json.get("institution")
    if institution:
        institution_obj = models.Institution.query.filter(
            models.Institution.institution == institution
        ).one_or_none()
        if institution_obj:
            institution_id = institution_obj.institution_id
        else:
            institution_obj = models.Institution(institution=institution)
            db.session.add(institution_obj)
            transaction_or_abort(db.session.flush)
            institution_id = institution_obj.institution_id

    ptp_objs = models.Participant(
        family_id=request.json.get("family_id"),
        participant_codename=request.json.get("participant_codename"),
        sex=request.json.get("sex"),
        notes=request.json.get("notes"),
        affected=request.json.get("affected"),
        solved=request.json.get("solved"),
        participant_type=request.json.get("participant_type"),
        institution_id=institution_id if institution else None,
        month_of_birth=request.json.get("month_of_birth"),
        created_by_id=created_by_id,
        updated_by_id=updated_by_id,
    )

    db.session.add(ptp_objs)
    transaction_or_abort(db.session.commit)

    location_header = "/api/participants/{}".format(ptp_objs.participant_id)

    return (
        jsonify(
            {
                **asdict(ptp_objs),
                "institution": ptp_objs.institution.institution
                if ptp_objs.institution
                else None,
                "created_by": ptp_objs.created_by.username,
                "updated_by": ptp_objs.updated_by.username,
            }
        ),
        201,
        {"location": location_header},
    )
