from dataclasses import asdict

from flask import abort, jsonify, request, Response, Blueprint, current_app as app
from flask_login import login_user, logout_user, current_user, login_required
from .extensions import db, login
from . import models
from sqlalchemy.orm import contains_eager, joinedload
from .utils import check_admin, transaction_or_abort, mixin, enum_validate


tissue_blueprint = Blueprint(
    "tissue",
    __name__,
)


editable_columns = [
    "extraction_date",
    "tissue_sample_type",
    "tissue_processing",
    "notes",
]


@tissue_blueprint.route("/api/tissue_samples/<int:id>", methods=["GET"])
@login_required
def get_tissue_sample(id: int):
    if app.config.get("LOGIN_DISABLED") or current_user.is_admin:
        user_id = request.args.get("user")
    else:
        user_id = current_user.user_id

    if user_id:
        tissue_sample = (
            models.TissueSample.query.filter_by(tissue_sample_id=id)
            .options(
                contains_eager(models.TissueSample.datasets),
                joinedload(models.TissueSample.created_by),
                joinedload(models.TissueSample.updated_by),
            )
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
            .one_or_none()
        )
    else:
        tissue_sample = (
            models.TissueSample.query.filter_by(tissue_sample_id=id)
            .options(
                joinedload(models.TissueSample.datasets),
                joinedload(models.TissueSample.created_by),
                joinedload(models.TissueSample.updated_by),
            )
            .one_or_none()
        )

    if not tissue_sample:
        return "Not Found", 404

    return jsonify(
        {
            **asdict(tissue_sample),
            "created_by": tissue_sample.created_by.username,
            "updated_by": tissue_sample.updated_by.username,
            "datasets": [
                {
                    **asdict(dataset),
                }
                for dataset in tissue_sample.datasets
            ],
        }
    )


@tissue_blueprint.route("/api/tissue_samples/<int:id>", methods=["DELETE"])
@login_required
@check_admin
def delete_tissue_sample(id: int):
    tissue_sample = (
        models.TissueSample.query.filter(models.TissueSample.tissue_sample_id == id)
        .options(
            joinedload(models.TissueSample.datasets),
        )
        .first_or_404()
    )
    if not tissue_sample.datasets:
        try:
            db.session.delete(tissue_sample)
            db.session.commit()
            return "Updated", 204
        except:
            db.session.rollback()
            return "Server error", 500
    else:
        return "Tissue has dataset(s), cannot delete", 422


@tissue_blueprint.route("/api/tissue_samples", methods=["POST"])
@login_required
@check_admin
def create_tissue_sample():
    if not request.json:
        return "Request body must be JSON", 400

    tissue_sample_type = request.json.get("tissue_sample_type")
    if not tissue_sample_type:
        return "A tissue sample type must be provided", 400

    participant_id = request.json.get("participant_id")
    if not participant_id:
        return "A participant id must be provided", 400

    models.Participant.query.filter_by(participant_id=participant_id).first_or_404()

    enum_error = enum_validate(models.TissueSample, request.json, editable_columns)

    if enum_error:
        return enum_error, 400

    try:
        created_by_id = updated_by_id = current_user.user_id
    except:  # LOGIN DISABLED
        created_by_id = updated_by_id = 1

    tissue_sample = models.TissueSample(
        **{
            "participant_id": participant_id,
            "extraction_date": request.json.get("extraction_date"),
            "tissue_sample_type": tissue_sample_type,
            "tissue_processing": request.json.get("tissue_processing"),
            "notes": request.json.get("notes"),
            "created_by_id": created_by_id,
            "updated_by_id": updated_by_id,
        }
    )
    try:
        db.session.add(tissue_sample)
        db.session.commit()
        ts_id = tissue_sample.tissue_sample_id
        location_header = "/api/tissue_samples/{}".format(ts_id)
        return (
            jsonify(
                {
                    **asdict(tissue_sample),
                    "created_by": tissue_sample.created_by.username,
                    "updated_by": tissue_sample.updated_by.username,
                }
            ),
            201,
            {"location": location_header},
        )
    except:
        db.session.rollback()
        return "Server error", 500


@tissue_blueprint.route("/api/tissue_samples/<int:id>", methods=["PATCH"])
@login_required
def update_tissue_sample(id: int):
    if not request.json:
        return "Request body must be JSON", 415

    if app.config.get("LOGIN_DISABLED") or current_user.is_admin:
        user_id = request.args.get("user")
    else:
        user_id = current_user.user_id

    if user_id:
        tissue_sample = (
            models.TissueSample.query.filter_by(tissue_sample_id=id)
            .options(
                contains_eager(models.TissueSample.datasets),
                # contains_eager(models.TissueSample.created_by),
                # contains_eager(models.TissueSample.updated_by),
            )
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
            .one_or_none()
        )
    else:
        tissue_sample = (
            models.TissueSample.query.filter_by(tissue_sample_id=id)
            .options(
                joinedload(models.TissueSample.datasets),
                joinedload(models.TissueSample.created_by),
                joinedload(models.TissueSample.updated_by),
            )
            .one_or_none()
        )

    if not tissue_sample:
        return "Not Found", 404

    enum_error = mixin(tissue_sample, request.json, editable_columns)

    if enum_error:
        return enum_error, 400

    if user_id:
        tissue_sample.updated_by_id = user_id

    transaction_or_abort(db.session.commit)

    return jsonify(
        {
            **asdict(tissue_sample),
            "created_by": tissue_sample.created_by.username,
            "updated_by": tissue_sample.updated_by.username,
        }
    )
