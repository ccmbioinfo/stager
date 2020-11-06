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


@app.route("/api/analyses", methods=["GET"], endpoint="analyses_list")
@login_required
def analyses_list():
    since_date = request.args.get("since", default="0001-01-01T00:00:00-04:00")
    try:
        since_date = datetime.fromisoformat(since_date)
    except:
        return "Malformed query date", 400

    u1 = aliased(models.User)
    u2 = aliased(models.User)
    u3 = aliased(models.User)
    db_analyses = (
        db.session.query(models.Analysis, u1, u2, u3)
        .filter(models.Analysis.updated >= since_date)
        .join(u1, models.Analysis.requester == u1.user_id)
        .join(u2, models.Analysis.updated_by == u2.user_id)
        .outerjoin(u3, models.Analysis.assignee == u3.user_id)
        .all()
    )

    analyses = [
        {
            **asdict(analysis),
            "requester": requester and requester.username,
            "updated_by": updated_by and updated_by.username,
            "assignee": assignee and assignee.username,
        }
        for analysis, requester, updated_by, assignee in db_analyses
    ]

    return jsonify(analyses)


@app.route("/api/analyses/<int:id>", methods=["GET"])
@login_required
def get_analysis(id: int):
    analysis = (
        models.Analysis.query.filter(models.Analysis.analysis_id == id)
        .outerjoin(models.Analysis.datasets)
        .join(models.Pipeline)
        .one_or_none()
    )
    if not analysis:
        return "Not Found", 404
    else:
        return jsonify(
            {
                **asdict(analysis),
                "requester": analysis.requester_user.username,
                "updated_by": analysis.updated_by_user.username,
                "assignee": analysis.assignee_user and analysis.assignee_user.username,
                "pipeline": analysis.pipeline,
                "datasets": [
                    {
                        **asdict(dataset),
                        "tissue_sample_type": dataset.tissue_sample.tissue_sample_type,
                        "participant_codename": dataset.tissue_sample.participant.participant_codename,
                        "participant_type": dataset.tissue_sample.participant.participant_type,
                        "sex": dataset.tissue_sample.participant.sex,
                        "family_codename": dataset.tissue_sample.participant.family.family_codename,
                    }
                    for dataset in analysis.datasets
                ],
            }
        )


@app.route("/api/analyses", methods=["POST"])
@login_required
def post_analyses():

    if not request.json:
        return "Request body must be JSON!", 400
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
        requester = updated_by = current_user.user_id
    except:  # LOGIN DISABLED
        requester = updated_by = 1

    obj = models.Analysis(
        **{
            "requested": requested,
            "analysis_state": analysis_state,
            "requester": requester,
            "updated_by": updated_by,
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

    return jsonify(obj)


@app.route("/api/analyses/<int:id>", methods=["DELETE"])
@login_required
@routes.check_admin
def delete_analysis(id: int):
    analysis = models.Analysis.query.filter(
        models.Analysis.analysis_id == id
    ).one_or_none()
    if analysis:
        try:
            db.session.delete(analysis)
            db.session.commit()
            return "Updated", 204
        except:
            db.session.rollback()
            return "Server error", 500
    else:
        return "Not Found", 404
