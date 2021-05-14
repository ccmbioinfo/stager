from dataclasses import asdict

from flask import Blueprint, Response, abort, current_app as app, jsonify, request
from flask_login import current_user, login_required
from sqlalchemy import distinct, func
from sqlalchemy.orm import contains_eager, joinedload

from . import models
from .extensions import db
from .utils import (
    check_admin,
    csv_response,
    enum_validate,
    expects_csv,
    expects_json,
    filter_in_enum_or_abort,
    filter_updated_or_abort,
    mixin,
    paged,
    paginated_response,
    transaction_or_abort,
    validate_json,
)

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


@datasets_blueprint.route("/api/datasets", methods=["GET"], strict_slashes=False)
@login_required
@paged
def list_datasets(page: int, limit: int) -> Response:
    order_by = request.args.get("order_by", type=str)
    allowed_columns = [
        "dataset_type",
        "condition",
        "notes",
        "updated",
        "updated_by",
        "linked_files",
        "tissue_sample_type",
        "participant_codename",
        "family_codename",
    ]
    if order_by is None:
        order = None  # system default, likely dataset_id
    elif order_by == "updated_by":
        order = models.User.username
    elif order_by == "linked_files":
        order = models.DatasetFile.path
    elif order_by == "tissue_sample_type":
        order = models.TissueSample.tissue_sample_type
    elif order_by == "participant_codename":
        order = models.Participant.participant_codename
    elif order_by == "family_codename":
        order = models.Family.family_codename
    elif order_by in allowed_columns:
        # Since this is an elif clause, we know special cases are already handled above.
        # order_by has been restricted to a known list, so we can safely use getattr
        order = getattr(models.Dataset, order_by)
    else:
        abort(400, description=f"order_by must be one of {allowed_columns}")

    if order:
        order_dir = request.args.get("order_dir", type=str)
        if order_dir == "desc":
            order = order.desc()
        elif order_dir == "asc":
            order = order.asc()
        else:
            abort(400, description="order_dir must be either 'asc' or 'desc'")

    filters = []
    notes = request.args.get("notes", type=str)
    if notes:
        filters.append(func.instr(models.Dataset.notes, notes))
    updated_by = request.args.get("updated_by", type=str)
    if updated_by:
        filters.append(func.instr(models.User.username, updated_by))
    dataset_id = request.args.get("dataset_id", type=str)
    if dataset_id:
        filters.append(models.Dataset.dataset_id == dataset_id)
    linked_files = request.args.get("linked_files", type=str)
    if linked_files:
        filters.append(func.instr(models.DatasetFile.path, linked_files))
    participant_codename = request.args.get("participant_codename", type=str)
    if participant_codename:
        filters.append(
            func.instr(models.Participant.participant_codename, participant_codename)
        )
    family_codename = request.args.get("family_codename", type=str)
    if family_codename:
        filters.append(func.instr(models.Family.family_codename, family_codename))
    dataset_type = request.args.get("dataset_type", type=str)
    if dataset_type:
        filters.append(models.Dataset.dataset_type.in_(dataset_type.split(",")))
    condition = request.args.get("condition", type=str)
    if condition:
        filters.append(
            filter_in_enum_or_abort(
                models.Dataset.condition, models.DatasetCondition, condition
            )
        )
    tissue_sample_type = request.args.get("tissue_sample_type", type=str)
    if tissue_sample_type:
        filters.append(
            filter_in_enum_or_abort(
                models.TissueSample.tissue_sample_type,
                models.TissueSampleType,
                tissue_sample_type,
            )
        )
    updated = request.args.get("updated", type=str)
    if updated:
        filters.append(filter_updated_or_abort(models.Dataset.updated, updated))

    if app.config.get("LOGIN_DISABLED") or current_user.is_admin:
        user_id = request.args.get("user")
    else:
        user_id = current_user.user_id
    if user_id:  # Regular user or assumed identity, return only permitted datasets
        query = (
            models.Dataset.query.options(
                contains_eager(models.Dataset.tissue_sample)
                .contains_eager(models.TissueSample.participant)
                .contains_eager(models.Participant.family),
                contains_eager(models.Dataset.tissue_sample)
                .contains_eager(models.TissueSample.participant)
                .joinedload(models.Participant.institution),
                contains_eager(models.Dataset.files),
                contains_eager(models.Dataset.updated_by),
            )
            .join(models.Dataset.tissue_sample)
            .join(models.TissueSample.participant)
            .join(models.Participant.family)
            .outerjoin(models.Dataset.files)
            .join(models.Dataset.updated_by)
            .join(models.groups_datasets_table)
            .join(
                models.users_groups_table,
                models.groups_datasets_table.columns.group_id
                == models.users_groups_table.columns.group_id,
            )
            .filter(models.users_groups_table.columns.user_id == user_id, *filters)
        )
    else:  # Admin or LOGIN_DISABLED, authorized to query all datasets
        query = (
            models.Dataset.query.options(
                contains_eager(models.Dataset.tissue_sample)
                .contains_eager(models.TissueSample.participant)
                .contains_eager(models.Participant.family),
                contains_eager(models.Dataset.tissue_sample)
                .contains_eager(models.TissueSample.participant)
                .joinedload(models.Participant.institution),
                contains_eager(models.Dataset.files),
                contains_eager(models.Dataset.updated_by),
            )
            .join(models.Dataset.tissue_sample)
            .join(models.TissueSample.participant)
            .join(models.Participant.family)
            .outerjoin(models.Dataset.files)
            .join(models.Dataset.updated_by)
            .filter(*filters)
        )

    total_count = query.with_entities(
        func.count(distinct(models.Dataset.dataset_id))
    ).scalar()
    datasets = query.order_by(order).limit(limit).offset(page * (limit or 0)).all()

    results = [
        {
            **asdict(dataset),
            "tissue_sample_type": dataset.tissue_sample.tissue_sample_type,
            "participant_codename": dataset.tissue_sample.participant.participant_codename,
            "participant_type": dataset.tissue_sample.participant.participant_type,
            "institution": dataset.tissue_sample.participant.institution
            and dataset.tissue_sample.participant.institution.institution,
            "sex": dataset.tissue_sample.participant.sex,
            "family_codename": dataset.tissue_sample.participant.family.family_codename,
            "created_by": dataset.created_by.username,
            "updated_by": dataset.updated_by.username,
            "group_code": [group.group_code for group in dataset.groups]
            if current_user.is_admin or len(current_user.groups) > 1
            else None,
        }
        for dataset in datasets
    ]

    if expects_json(request):
        return paginated_response(results, page, total_count, limit)
    elif expects_csv(request):
        return csv_response(
            results,
            filename="datasets_report.csv",
            colnames=[
                "family_codename",
                "participant_codename",
                "tissue_sample_type",
                "dataset_type",
                "condition",
                "notes",
                "linked_files",
                "updated",
                "updated_by",
                "dataset_id",
            ],
        )

    abort(406, "Only 'text/csv' and 'application/json' HTTP accept headers supported")


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
            "institution": dataset.tissue_sample.participant.institution.institution
            if dataset.tissue_sample.participant.institution
            else None,
            "sex": dataset.tissue_sample.participant.sex,
            "family_codename": dataset.tissue_sample.participant.family.family_codename,
            "created_by": dataset.tissue_sample.participant.created_by.username,
            "updated_by": dataset.tissue_sample.participant.updated_by.username,
            "analyses": [
                {
                    **asdict(analysis),
                    "requester": analysis.requester.username,
                    "updated_by": analysis.updated_by.username,
                    "assignee": analysis.assignee_id and analysis.assignee.username,
                }
                for analysis in dataset.analyses
            ],
        }
    )


@datasets_blueprint.route("/api/datasets/<int:id>", methods=["PATCH"])
@login_required
@validate_json
def update_dataset(id: int):

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
        abort(400, description=enum_error)

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
            abort(500, description="Server error")
    else:
        abort(422, description="Dataset has analyses, cannot delete")


@datasets_blueprint.route("/api/datasets", methods=["POST"], strict_slashes=False)
@login_required
@validate_json
def create_dataset():

    dataset_type = request.json.get("dataset_type")
    if not dataset_type:
        abort(400, description="A dataset type must be provided")

    tissue_sample_id = request.json.get("tissue_sample_id")
    if not tissue_sample_id:
        abort(400, description="A tissue sample id must be provided")

    sequencing_date = request.json.get("sequencing_date")
    if not sequencing_date:
        abort(400, description="A sequencing date must be provided")

    models.TissueSample.query.filter_by(
        tissue_sample_id=tissue_sample_id
    ).first_or_404()

    enum_error = enum_validate(models.Dataset, request.json, editable_columns)

    if enum_error:
        abort(400, description=enum_error)

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
