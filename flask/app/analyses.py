from datetime import datetime
import json
from typing import Any, Callable, Dict, List, Union
from dataclasses import asdict

from .extensions import db, login
from . import models

from flask import abort, jsonify, request, Response, Blueprint, current_app as app
from flask_login import login_user, logout_user, current_user, login_required
from sqlalchemy import exc
from sqlalchemy.orm import contains_eager, aliased, joinedload
from werkzeug.exceptions import HTTPException


from .utils import mixin, check_admin, transaction_or_abort

analyses_blueprint = Blueprint(
    "analyses",
    __name__,
)


@analyses_blueprint.route("/api/analyses", methods=["GET"], endpoint="analyses_list")
@login_required
def list_analyses():
    if app.config.get("LOGIN_DISABLED") or current_user.is_admin:
        user_id = request.args.get("user")
    else:
        user_id = current_user.user_id

    since_date = request.args.get("since", default="0001-01-01T00:00:00-04:00")
    try:
        since_date = datetime.fromisoformat(since_date)
    except:
        return "Malformed query date", 400

    if user_id:
        query = (
            db.session.query(models.Analysis)
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
        )
    else:
        query = db.session.query(models.Analysis)

    analyses = (
        query.filter(models.Analysis.updated >= since_date)
        .outerjoin(models.Pipeline)
        .all()
    )
    return jsonify(
        [
            {
                **asdict(analysis),
                "requester": analysis.requester and analysis.requester.username,
                "updated_by_id": analysis.updated_by_id
                and analysis.updated_by.username,
                "assignee": analysis.assignee_id and analysis.assignee.username,
                "pipeline": analysis.pipeline,
            }
            for analysis in analyses
        ]
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
        return "Not Found", 404

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
def create_analysis():
    if not request.json:
        return "Request body must be JSON!", 415

    pipeline_id = request.json.get("pipeline_id")
    if not isinstance(pipeline_id, int):
        return "Missing pipeline_id field or invalid type", 400

    datasets = request.json.get("datasets")
    if not (isinstance(datasets, list) and len(datasets)):
        return "Missing datasets field or invalid type", 400

    if not models.Pipeline.query.get(pipeline_id):
        return "Pipeline not found", 404

    if app.config.get("LOGIN_DISABLED"):
        user_id = request.args.get("user")
        requester_id = updated_by_id = user_id or 1
    elif current_user.is_admin:
        user_id = request.args.get("user")
        requester_id = updated_by_id = user_id or current_user.user_id
    else:
        requester_id = updated_by_id = user_id = current_user.user_id

    # assumed to supersede user_id/admin check
    compatible_datasets_pipelines_query = (
        db.session.query(
            models.Dataset, models.MetaDatasetType_DatasetType, models.PipelineDatasets
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
        return "Requested pipelines are incompatible with datasets", 404

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
        return "Some datasets were not found", 404

    now = datetime.now()
    analysis = models.Analysis(
        analysis_state="Requested",
        pipeline_id=pipeline_id,
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
        return "Server error", 500


@analyses_blueprint.route("/api/analyses/<int:id>", methods=["PATCH"])
@login_required
def update_analysis(id: int):
    if not request.json:
        return "Request body must be JSON", 415

    if app.config.get("LOGIN_DISABLED") or current_user.is_admin:
        user_id = request.args.get("user")
    else:
        user_id = current_user.user_id
        if request.json.get("analysis_state") not in [
            "Cancelled",
            None,  # account for default
        ]:
            return "Analysis state changes are restricted to administrators", 403

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
                return "assignee not found", 400

    enum_error = mixin(analysis, request.json, editable_columns)

    if enum_error:
        return enum_error, 400

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
