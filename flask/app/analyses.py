from datetime import datetime
import json
from typing import Any, Callable, Dict, List, Union
from dataclasses import asdict

from . import db, login, models, routes

from flask import abort, jsonify, request, Response, Blueprint, current_app as app
from flask_login import login_user, logout_user, current_user, login_required
from sqlalchemy import exc
from sqlalchemy.orm import contains_eager, aliased, joinedload
from werkzeug.exceptions import HTTPException


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
    try:
        dts_pks = request.json["datasets"]
    except KeyError:
        return "No Dataset field provided", 400
    try:
        pipeline_pk = request.json["pipeline_id"]
    except KeyError:
        return "No Pipeline field provided", 400

    if not dts_pks:
        return "No Dataset IDs provided", 400

    if not pipeline_pk:
        return "No Pipeline ID provided", 400

    pipeline_id = models.Pipeline.query.get(pipeline_pk).pipeline_id

    now = datetime.now()
    requested = now
    updated = now
    analysis_state = "Requested"
    try:
        requester_id = updated_by_id = current_user.user_id
    except:  # LOGIN DISABLED
        requester_id = updated_by_id = 1

    obj = models.Analysis(
        **{
            "requested": requested,
            "analysis_state": analysis_state,
            "requester_id": requester_id,
            "updated_by_id": updated_by_id,
            "updated": updated,
            "requested": requested,
            "pipeline_id": pipeline_id,
        }
    )

    db.session.add(obj)
    routes.transaction_or_abort(db.session.flush)

    # update the dataset_analyses table
    dataset_analyses_obj = [
        {"dataset_id": x, "analysis_id": obj.analysis_id} for x in dts_pks
    ]

    inst = models.datasets_analyses_table.insert().values(dataset_analyses_obj)
    try:
        db.session.execute(inst)
    except:
        db.session.rollback()
        return "Server error", 500

    routes.transaction_or_abort(db.session.commit)

    return jsonify(
        {
            **asdict(obj),
            "assignee": obj.assignee_id and obj.assignee.username,
            "requester": obj.requester_id and obj.requester.username,
            "updated_by": obj.updated_by_id and obj.updated_by.username,
        }
    )


@analyses_blueprint.route("/api/analyses/<int:id>", methods=["DELETE"])
@login_required
@routes.check_admin
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

    enum_error = routes.mixin(analysis, request.json, editable_columns)

    if enum_error:
        return enum_error, 400

    if user_id:
        analysis.updated_by_id = user_id

    routes.transaction_or_abort(db.session.commit)

    return jsonify(
        {
            **asdict(analysis),
            "assignee": analysis.assignee_id and analysis.assignee.username,
            "requester": analysis.requester_id and analysis.requester.username,
            "updated_by_id": analysis.updated_by_id and analysis.updated_by.username,
        }
    )
