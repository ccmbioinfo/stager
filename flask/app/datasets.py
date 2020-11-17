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


@app.route("/api/datasets", methods=["GET"])
@login_required
def datasets_list():
    if app.config.get("LOGIN_DISABLED") or current_user.is_admin:
        user_id = request.args.get("user")
    else:
        user_id = current_user.user_id

    if user_id:
        query = (
            models.Dataset.query.join(models.groups_datasets_table)
            .join(
                models.users_groups_table,
                models.groups_datasets_table.columns.group_id
                == models.users_groups_table.columns.group_id,
            )
            .filter(models.users_groups_table.columns.user_id == user_id)
        )
    else:
        query = models.Dataset.query

    db_datasets = query.options(
        joinedload(models.Dataset.tissue_sample)
        .joinedload(models.TissueSample.participant)
        .joinedload(models.Participant.family)
    ).all()

    datasets = [
        {
            **asdict(dataset),
            "tissue_sample_type": dataset.tissue_sample.tissue_sample_type,
            "participant_codename": dataset.tissue_sample.participant.participant_codename,
            "participant_type": dataset.tissue_sample.participant.participant_type,
            "sex": dataset.tissue_sample.participant.sex,
            "family_codename": dataset.tissue_sample.participant.family.family_codename,
        }
        for dataset in db_datasets
    ]
    return jsonify(datasets)


@app.route("/api/datasets/<int:id>", methods=["GET"])
@login_required
def get_dataset(id: int):
    if app.config.get("LOGIN_DISABLED") or current_user.is_admin:
        user_id = request.args.get("user")
    else:
        user_id = current_user.user_id

    if user_id:
        dataset = (
            models.Dataset.query.filter_by(dataset_id=id)
            .options(
                joinedload(models.Dataset.analyses),
                joinedload(models.Dataset.tissue_sample)
                .joinedload(models.TissueSample.participant)
                .joinedload(models.Participant.family),
            )
            .join(models.groups_datasets_table)
            .join(
                models.users_groups_table,
                models.groups_datasets_table.columns.group_id
                == models.users_groups_table.columns.group_id,
            )
            .filter(models.users_groups_table.columns.user_id == user_id)
            .one_or_none()
        )
    else:
        dataset = (
            models.Dataset.query.filter_by(dataset_id=id)
            .options(
                joinedload(models.Dataset.analyses),
                joinedload(models.Dataset.tissue_sample)
                .joinedload(models.TissueSample.participant)
                .joinedload(models.Participant.family),
            )
            .one_or_none()
        )
    if not dataset:
        return "Not Found", 404
    else:
        return jsonify(
            {
                **asdict(dataset),
                "tissue_sample": dataset.tissue_sample,
                "participant_codename": dataset.tissue_sample.participant.participant_codename,
                "participant_type": dataset.tissue_sample.participant.participant_type,
                "sex": dataset.tissue_sample.participant.sex,
                "family_codename": dataset.tissue_sample.participant.family.family_codename,
                "analyses": [
                    {
                        **asdict(analysis),
                        "requester": analysis.requester_user.username,
                        "updated_by": analysis.updated_by_user.username,
                        "assignee": analysis.assignee_user
                        and analysis.assignee_user.username,
                    }
                    for analysis in dataset.analyses
                ],
            }
        )


@app.route("/api/datasets/<int:id>", methods=["DELETE"])
@login_required
@routes.check_admin
def delete_dataset(id: int):
    dataset = (
        models.Dataset.query.filter(models.Dataset.dataset_id == id)
        .options(joinedload(models.Dataset.analyses))
        .one_or_none()
    )
    if dataset and not dataset.analyses:
        try:
            db.session.delete(dataset)
            db.session.commit()
            return "Updated", 204
        except:
            db.session.rollback()
            return "Server error", 500
    elif dataset:
        return "Dataset has analyses, cannot delete", 422
    else:
        return "Not Found", 404


@app.route("/api/datasets/<int:id>", methods=["PATCH"])
@login_required
def update_dataset(id: int):
    if not request.json:
        return "Request body must be JSON", 415

    if app.config.get("LOGIN_DISABLED") or current_user.is_admin:
        user_id = request.args.get("user")
    else:
        user_id = current_user.user_id

    if user_id:
        table = (
            models.Dataset.query.filter_by(dataset_id=id)
            .join(models.groups_datasets_table)
            .join(
                models.users_groups_table,
                models.groups_datasets_table.columns.group_id
                == models.users_groups_table.columns.group_id,
            )
            .filter(models.users_groups_table.columns.user_id == user_id)
            .one_or_none()
        )
    else:
        table = models.Dataset.query.filter_by(dataset_id=id).one_or_none()

    if not table:
        return "Not Found", 404

    editable_columns = [
        "dataset_type",
        "input_hpf_path",
        "notes",
        "condition",
        "extraction_protocol",
        "capture_kit",
        "library_prep_method",
        "library_prep_date",
        "read_length",
        "read_type",
        "sequencing_id",
        "sequencing_date",
        "sequencing_centre",
        "batch_id",
        "discriminator",
    ]

    enum_error = routes.mixin(table, request.json, editable_columns)

    if enum_error:
        return enum_error, 400

    try:
        table.updated_by = current_user.user_id
    except:
        pass  # LOGIN_DISABLED

    routes.transaction_or_abort(db.session.commit)

    return jsonify(table)
