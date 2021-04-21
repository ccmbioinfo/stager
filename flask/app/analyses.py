from dataclasses import asdict
from datetime import datetime

from flask_login import current_user, login_required
from sqlalchemy import distinct, func
from sqlalchemy.orm import aliased, contains_eager

from flask import Blueprint, Response, abort, current_app as app, jsonify, request

from . import models
from .extensions import db
from .utils import (
    check_admin,
    enum_validate,
    filter_in_enum_or_abort,
    filter_updated_or_abort,
    mixin,
    paged,
    transaction_or_abort,
    validate_json,
)

analyses_blueprint = Blueprint(
    "analyses",
    __name__,
)


@analyses_blueprint.route("/api/analyses", methods=["GET"], endpoint="analyses_list")
@login_required
@paged
def list_analyses(page: int, limit: int) -> Response:
    order_by = request.args.get("order_by", type=str)
    allowed_columns = [
        "updated",
        "result_path",
        "notes",
        "analysis_state",
        "pipeline_id",
        "assignee",
        "requester",
        "priority",
    ]
    assignee_user = aliased(models.User)
    requester_user = aliased(models.User)
    if order_by is None:
        order = None  # system default, likely analysis_id
    elif order_by == "assignee":
        order = assignee_user.username
    elif order_by == "requester":
        order = requester_user.username
    elif order_by in allowed_columns:
        # Since this is an elif clause, we know special cases are already handled above.
        # order_by has been restricted to a known list, so we can safely use getattr
        order = getattr(models.Analysis, order_by)
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
    assignee = request.args.get("assignee", type=str)
    if assignee:
        filters.append(func.instr(assignee_user.username, assignee))
    requester = request.args.get("requester", type=str)
    if requester:
        filters.append(func.instr(requester_user.username, requester))
    notes = request.args.get("notes", type=str)
    if notes:
        filters.append(func.instr(models.Analysis.notes, notes))
    priority = request.args.get("priority", type=str)
    if priority:
        filters.append(
            filter_in_enum_or_abort(
                models.Analysis.priority,
                models.PriorityType,
                priority,
            )
        )
    result_path = request.args.get("result_path", type=str)
    if result_path:
        filters.append(func.instr(models.Analysis.result_path, result_path))
    updated = request.args.get("updated", type=str)
    if updated:
        filters.append(filter_updated_or_abort(models.Analysis.updated, updated))
    analysis_state = request.args.get("analysis_state", type=str)
    if analysis_state:
        filters.append(
            filter_in_enum_or_abort(
                models.Analysis.analysis_state,
                models.AnalysisState,
                analysis_state,
            )
        )
    pipeline_id = request.args.get("pipeline_id", type=str)
    if pipeline_id:
        try:
            filters.append(
                models.Analysis.pipeline_id.in_(
                    [int(pk) for pk in pipeline_id.split(",")]
                )
            )
        except ValueError as err:
            abort(400, description=err)

    if app.config.get("LOGIN_DISABLED") or current_user.is_admin:
        user_id = request.args.get("user")
    else:
        user_id = current_user.user_id
    query = models.Analysis.query
    if assignee:
        query = query.join(assignee_user, models.Analysis.assignee)
    if requester:
        query = query.join(requester_user, models.Analysis.requester)
    if user_id:  # Regular user or assumed identity, return only permitted analyses
        query = (
            query.join(models.datasets_analyses_table)
            .join(
                models.groups_datasets_table,
                models.datasets_analyses_table.columns.dataset_id
                == models.groups_datasets_table.columns.dataset_id,
            )
            .join(
                models.users_groups_table,
                models.groups_datasets_table.columns.group_id
                == models.users_groups_table.columns.group_id,
            )
            .filter(models.users_groups_table.columns.user_id == user_id, *filters)
        )
    else:  # Admin or LOGIN_DISABLED, authorized to query all analyses
        query = query.filter(*filters)

    total_count = query.with_entities(
        func.count(distinct(models.Analysis.analysis_id))
    ).scalar()
    analyses = query.order_by(order).limit(limit).offset(page * (limit or 0)).all()

    return jsonify(
        {
            "data": [
                {
                    **asdict(analysis),
                    "requester": analysis.requester.username,
                    "updated_by": analysis.updated_by.username,
                    "assignee": analysis.assignee_id and analysis.assignee.username,
                    "pipeline": analysis.pipeline,
                }
                for analysis in analyses
            ],
            "page": page if limit else 0,
            "total_count": total_count,
        }
    )


@analyses_blueprint.route("/api/analyses/<int:id>", methods=["GET"])
@login_required
def get_analysis(id: int):
    if app.config.get("LOGIN_DISABLED") or current_user.is_admin:
        user_id = request.args.get("user")
    else:
        user_id = current_user.user_id

    if user_id:
        analysis = (
            models.Analysis.query.filter(models.Analysis.analysis_id == id)
            .options(contains_eager(models.Analysis.datasets))
            .join(
                models.datasets_analyses_table,
                models.Analysis.analysis_id
                == models.datasets_analyses_table.columns.analysis_id,
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
            .join(models.Pipeline)
            .one_or_none()
        )
    else:
        analysis = (
            models.Analysis.query.filter(models.Analysis.analysis_id == id)
            .outerjoin(models.Analysis.datasets)
            .join(models.Pipeline)
            .one_or_none()
        )

    if not analysis:
        return abort(404)

    return jsonify(
        {
            **asdict(analysis),
            "requester": analysis.requester_id and analysis.requester.username,
            "updated_by": analysis.updated_by_id and analysis.updated_by.username,
            "assignee": analysis.assignee_id and analysis.assignee.username,
            "pipeline": analysis.pipeline,
            "datasets": [
                {
                    **asdict(dataset),
                    "tissue_sample_type": dataset.tissue_sample.tissue_sample_type,
                    "participant_codename": dataset.tissue_sample.participant.participant_codename,
                    "participant_type": dataset.tissue_sample.participant.participant_type,
                    "institution": dataset.tissue_sample.participant.institution.institution
                    if dataset.tissue_sample.participant.institution
                    else None,
                    "sex": dataset.tissue_sample.participant.sex,
                    "family_codename": dataset.tissue_sample.participant.family.family_codename,
                    "updated_by": dataset.tissue_sample.updated_by.username,
                    "created_by": dataset.tissue_sample.created_by.username,
                }
                for dataset in analysis.datasets
            ],
        }
    )


@analyses_blueprint.route("/api/analyses", methods=["POST"])
@login_required
@validate_json
def create_analysis():

    pipeline_id = request.json.get("pipeline_id")
    if not isinstance(pipeline_id, int):
        abort(400, description="Missing pipeline_id field or invalid type")

    datasets = request.json.get("datasets")
    if not (isinstance(datasets, list) and len(datasets)):
        abort(400, description="Missing datasets field or invalid type")

    if not models.Pipeline.query.get(pipeline_id):
        abort(404, description="Pipeline not found")

    enum_error = enum_validate(models.Analysis, request.json, ["priority"])

    if enum_error:
        abort(400, description=enum_error)

    if app.config.get("LOGIN_DISABLED"):
        user_id = request.args.get("user")
        requester_id = updated_by_id = user_id or 1
    elif current_user.is_admin:
        user_id = request.args.get("user")
        requester_id = updated_by_id = user_id or current_user.user_id
    else:
        requester_id = updated_by_id = user_id = current_user.user_id

    if user_id:
        found_datasets_query = (
            models.Dataset.query.join(
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
        )
    else:
        found_datasets_query = models.Dataset.query

    found_datasets = found_datasets_query.filter(
        models.Dataset.dataset_id.in_(datasets)
    ).all()

    if len(found_datasets) != len(datasets):
        abort(404, description="Some datasets were not found")

    compatible_datasets_pipelines_query = (
        db.session.query(
            models.Dataset,
            models.MetaDatasetType_DatasetType,
            models.PipelineDatasets,
        )
        .filter(models.Dataset.dataset_id.in_(datasets))
        .join(
            models.MetaDatasetType_DatasetType,
            models.Dataset.dataset_type
            == models.MetaDatasetType_DatasetType.dataset_type,
        )
        .join(
            models.PipelineDatasets,
            models.PipelineDatasets.supported_metadataset_type
            == models.MetaDatasetType_DatasetType.metadataset_type,
        )
        .filter(models.PipelineDatasets.pipeline_id == pipeline_id)
        .all()
    )

    if len(compatible_datasets_pipelines_query) != len(datasets):
        abort(404, description="Requested pipelines are incompatible with datasets")

    now = datetime.now()
    analysis = models.Analysis(
        analysis_state="Requested",
        pipeline_id=pipeline_id,
        priority=request.json.get("priority"),
        requester_id=requester_id,
        requested=now,
        updated=now,
        updated_by_id=updated_by_id,
        datasets=found_datasets,
    )

    db.session.add(analysis)
    transaction_or_abort(db.session.commit)

    return (
        jsonify(
            {
                **asdict(analysis),
                "requester": analysis.requester_id and analysis.requester.username,
                "updated_by": analysis.updated_by_id and analysis.updated_by.username,
                "assignee": analysis.assignee_id and analysis.assignee.username,
                "pipeline": analysis.pipeline,
                "datasets": [
                    {
                        **asdict(dataset),
                        "tissue_sample_type": dataset.tissue_sample.tissue_sample_type,
                        "participant_codename": dataset.tissue_sample.participant.participant_codename,
                        "participant_type": dataset.tissue_sample.participant.participant_type,
                        "institution": dataset.tissue_sample.participant.institution.institution
                        if dataset.tissue_sample.participant.institution
                        else None,
                        "sex": dataset.tissue_sample.participant.sex,
                        "family_codename": dataset.tissue_sample.participant.family.family_codename,
                        "updated_by": dataset.tissue_sample.updated_by.username,
                        "created_by": dataset.tissue_sample.created_by.username,
                    }
                    for dataset in analysis.datasets
                ],
            }
        ),
        201,
        {"location": f"/api/analyses/{analysis.analysis_id}"},
    )


@analyses_blueprint.route("/api/analyses/<int:id>", methods=["DELETE"])
@login_required
@check_admin
def delete_analysis(id: int):
    analysis = models.Analysis.query.filter(
        models.Analysis.analysis_id == id
    ).first_or_404()

    try:
        db.session.delete(analysis)
        db.session.commit()
        return "Updated", 204
    except:
        db.session.rollback()
        abort(500)


@analyses_blueprint.route("/api/analyses/<int:id>", methods=["PATCH"])
@login_required
@validate_json
def update_analysis(id: int):

    if app.config.get("LOGIN_DISABLED") or current_user.is_admin:
        user_id = request.args.get("user")
    else:
        user_id = current_user.user_id
        if request.json.get("analysis_state") not in [
            "Cancelled",
            None,  # account for default
        ]:
            abort(
                403,
                description="Analysis state changes are restricted to administrators",
            )

    if user_id:
        analysis = (
            models.Analysis.query.filter(models.Analysis.analysis_id == id)
            .join(
                models.datasets_analyses_table,
                models.Analysis.analysis_id
                == models.datasets_analyses_table.columns.analysis_id,
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
            .first_or_404()
        )
    else:
        analysis = models.Analysis.query.filter(
            models.Analysis.analysis_id == id
        ).first_or_404()

    editable_columns = [
        "analysis_state",
        "pipeline_id",
        "qsub_id",
        "result_path",
        "requested",
        "started",
        "finished",
        "notes",
        "priority",
    ]

    if "assignee" in request.json:
        if not request.json["assignee"]:
            analysis.assignee = None
        else:
            assignee = models.User.query.filter(
                models.User.username == request.json["assignee"]
            ).first()
            if assignee:
                analysis.assignee = assignee.user_id
            else:
                abort(400, description="Assignee not found")

    enum_error = enum_validate(models.Analysis, request.json, editable_columns)

    if enum_error:
        abort(400, description=enum_error)

    mixin(analysis, request.json, editable_columns)

    if request.json.get("analysis_state") == "Running":
        analysis.started = datetime.now()
    elif request.json.get("analysis_state") == "Done":
        analysis.finished = datetime.now()
    # Error and Cancelled defaults to time set in 'updated'

    if user_id:
        analysis.updated_by_id = user_id

    transaction_or_abort(db.session.commit)

    return jsonify(
        {
            **asdict(analysis),
            "assignee": analysis.assignee_id and analysis.assignee.username,
            "requester": analysis.requester_id and analysis.requester.username,
            "updated_by_id": analysis.updated_by_id and analysis.updated_by.username,
        }
    )
