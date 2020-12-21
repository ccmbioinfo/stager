from datetime import datetime
import json
from typing import Any, Callable, Dict, List, Union
from dataclasses import asdict

from .extensions import db, login
from . import models

from flask import abort, jsonify, request, Response, Blueprint, current_app as app
from flask_login import login_user, logout_user, current_user, login_required
from sqlalchemy import exc
from sqlalchemy.orm import aliased, joinedload
from werkzeug.exceptions import HTTPException

from .utils import mixin, transaction_or_abort, check_admin, enum_validate


editable_columns = [
    "dataset_type",
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

datasets_blueprint = Blueprint(
    "datasets",
    __name__,
)


@datasets_blueprint.route("/api/datasets", methods=["GET"])
@login_required
def list_datasets():
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

    datasets = query.options(
        joinedload(models.Dataset.tissue_sample)
        .joinedload(models.TissueSample.participant)
        .joinedload(models.Participant.family)
    ).all()

    return jsonify(
        [
            {
                **asdict(dataset),
                "tissue_sample_type": dataset.tissue_sample.tissue_sample_type,
                "participant_codename": dataset.tissue_sample.participant.participant_codename,
                "participant_type": dataset.tissue_sample.participant.participant_type,
                "sex": dataset.tissue_sample.participant.sex,
                "family_codename": dataset.tissue_sample.participant.family.family_codename,
                "created_by": dataset.tissue_sample.created_by.username,
                "updated_by": dataset.tissue_sample.updated_by.username,
            }
            for dataset in datasets
        ]
    )


@datasets_blueprint.route("/api/datasets/<int:id>", methods=["GET"])
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
                joinedload(models.Dataset.created_by),
                joinedload(models.Dataset.updated_by),
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
            .first_or_404()
        )
    else:
        dataset = (
            models.Dataset.query.filter_by(dataset_id=id)
            .options(
                joinedload(models.Dataset.analyses),
                joinedload(models.Dataset.created_by),
                joinedload(models.Dataset.updated_by),
                joinedload(models.Dataset.tissue_sample)
                .joinedload(models.TissueSample.participant)
                .joinedload(models.Participant.family),
            )
            .first_or_404()
        )

    return jsonify(
        {
            **asdict(dataset),
            "tissue_sample": dataset.tissue_sample,
            "participant_codename": dataset.tissue_sample.participant.participant_codename,
            "participant_type": dataset.tissue_sample.participant.participant_type,
            "sex": dataset.tissue_sample.participant.sex,
            "family_codename": dataset.tissue_sample.participant.family.family_codename,
            "created_by": dataset.tissue_sample.participant.created_by.username,
            "updated_by": dataset.tissue_sample.participant.updated_by.username,
            "analyses": [
                {
                    **asdict(analysis),
                    "requester": analysis.requester.username,
                    "updated_by": analysis.updated_by.username,
                    "assignee": analysis.assignee.username,
                }
                for analysis in dataset.analyses
            ],
        }
    )


@datasets_blueprint.route("/api/datasets/<int:id>", methods=["PATCH"])
@login_required
def update_dataset(id: int):
    if not request.json:
        return "Request body must be JSON", 415

    if app.config.get("LOGIN_DISABLED") or current_user.is_admin:
        user_id = request.args.get("user")
    else:
        user_id = current_user.user_id

    if user_id:
        dataset = (
            models.Dataset.query.filter_by(dataset_id=id)
            .join(models.groups_datasets_table)
            .join(
                models.users_groups_table,
                models.groups_datasets_table.columns.group_id
                == models.users_groups_table.columns.group_id,
            )
            .filter(models.users_groups_table.columns.user_id == user_id)
            .first_or_404()
        )
    else:
        dataset = models.Dataset.query.filter_by(dataset_id=id).first_or_404()

    enum_error = mixin(dataset, request.json, editable_columns)

    if enum_error:
        return enum_error, 400

    if "linked_files" in request.json:
        for existing in dataset.files:
            if existing.path not in request.json["linked_files"]:
                db.session.delete(existing)
        for path in request.json["linked_files"]:
            if path not in dataset.linked_files:
                dataset.files.append(models.DatasetFile(path=path))

    if user_id:
        dataset.updated_by_id = user_id

    transaction_or_abort(db.session.commit)

    return jsonify(
        {
            **asdict(dataset),
            "updated_by": dataset.updated_by.username,
            "created_by": dataset.created_by.username,
        }
    )


@datasets_blueprint.route("/api/datasets/<int:id>", methods=["DELETE"])
@login_required
@check_admin
def delete_dataset(id: int):
    dataset = (
        models.Dataset.query.filter(models.Dataset.dataset_id == id)
        .options(joinedload(models.Dataset.analyses))
        .first_or_404()
    )
    if not dataset.analyses:
        try:
            db.session.delete(dataset)
            db.session.commit()
            return "Updated", 204
        except:
            db.session.rollback()
            return "Server error", 500
    else:
        return "Dataset has analyses, cannot delete", 422


@datasets_blueprint.route("/api/datasets", methods=["POST"])
@login_required
def create_dataset():
    if not request.json:
        return "Request body must be JSON", 415

    dataset_type = request.json.get("dataset_type")
    if not dataset_type:
        return "A dataset type must be provided", 400

    tissue_sample_id = request.json.get("tissue_sample_id")
    if not tissue_sample_id:
        return "A tissue sample id must be provided", 400

    models.TissueSample.query.filter_by(
        tissue_sample_id=tissue_sample_id
    ).first_or_404()

    enum_error = enum_validate(models.Dataset, request.json, editable_columns)

    if enum_error:
        return enum_error, 400

    try:
        created_by_id = updated_by_id = current_user.user_id
    except:  # LOGIN DISABLED
        created_by_id = updated_by_id = 1

    dataset = models.Dataset(
        **{
            "tissue_sample_id": tissue_sample_id,
            "dataset_type": dataset_type,
            "notes": request.json.get("notes"),
            "condition": request.json.get("condition"),
            "extraction_protocol": request.json.get("extraction_protocol"),
            "capture_kit": request.json.get("capture_kit"),
            "library_prep_method": request.json.get("library_prep_method"),
            "library_prep_date": request.json.get("library_prep_date"),
            "read_length": request.json.get("read_length"),
            "read_type": request.json.get("read_type"),
            "sequencing_id": request.json.get("sequencing_id"),
            "sequencing_date": request.json.get("sequencing_date"),
            "sequencing_centre": request.json.get("sequencing_centre"),
            "batch_id": request.json.get("batch_id"),
            "created_by_id": created_by_id,
            "updated_by_id": updated_by_id,
            "discriminator": request.json.get("discriminator"),
        }
    )
    # TODO: add stricter checks?
    if request.json.get("linked_files"):
        for path in request.json["linked_files"]:
            dataset.files.append(models.DatasetFile(path=path))
    db.session.add(dataset)
    transaction_or_abort(db.session.commit)
    ds_id = dataset.dataset_id
    location_header = "/api/datasets/{}".format(ds_id)

    return (
        jsonify(
            {
                **asdict(dataset),
                "updated_by": dataset.updated_by.username,
                "created_by": dataset.created_by.username,
            }
        ),
        201,
        {"location": location_header},
    )
