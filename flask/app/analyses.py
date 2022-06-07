from dataclasses import asdict
from datetime import datetime
from typing import List

from flask import Blueprint, Response, abort, current_app as app, jsonify, request
from flask_login import login_required
from sqlalchemy import distinct, func, or_, select
from sqlalchemy.orm import aliased, joinedload, selectinload
from sqlalchemy.sql.expression import cast

from . import models
from .extensions import db
from .schemas import AnalysisSchema
from .slurm import run_crg2_on_family
from .utils import (
    check_admin,
    clone_entity,
    csv_response,
    expects_csv,
    expects_json,
    filter_datasets_by_user_groups,
    filter_in_enum_or_abort,
    filter_updated_or_abort,
    get_current_user,
    validate_enums_and_set_fields,
    paged,
    paginated_response,
    transaction_or_abort,
    validate_filter_input,
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
        "kind",
        "assignee",
        "requester",
        "priority",
        "requested",
        "analysis_id",
    ]
    assignee_user = aliased(models.User)
    requester_user = aliased(models.User)
    app.logger.debug("Validating 'order_by' parameter..")
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
        app.logger.debug("Validating 'order_dir' parameter..")
        order_dir = request.args.get("order_dir", type=str)
        # need to cast here because the cast value doesn't have a boolean representation
        order = cast(order, db.CHAR) if order_by == "analysis_state" else order
        if order_dir == "desc":
            order = order.desc()
        elif order_dir == "asc":
            order = order.asc()
        else:
            abort(400, description="order_dir must be either 'asc' or 'desc'")
        app.logger.debug("Ordering by '%s' in '%s' direction", order_by, order_dir)

    app.logger.debug("Validating filter parameters..")

    filters = []
    assignee = request.args.get("assignee", type=str)
    if assignee:
        app.logger.debug("Filter by assignee: '%s'", assignee)
        filters.append(func.instr(assignee_user.username, assignee))
    requester = request.args.get("requester", type=str)
    if requester:
        app.logger.debug("Filter by requester: '%s'", requester)
        filters.append(func.instr(requester_user.username, requester))
    notes = request.args.get("notes", type=str)
    if notes:
        app.logger.debug("Filter by notes: '%s'", notes)
        filters.append(func.instr(models.Analysis.notes, notes))
    # this edges into the [GET] /:id endpoint, but the index/show payloads diverge, causing issues for the FE, and this is technically still a filter
    analysis_id = request.args.get("analysis_id", type=str)
    if analysis_id:
        app.logger.debug("Filter by analysis_id: '%s'", analysis_id)
        filters.append(func.instr(models.Analysis.analysis_id, analysis_id))
    priority = request.args.get("priority", type=str)
    if priority:
        app.logger.debug("Filter by priority: '%s'", priority)
        filters.append(
            filter_in_enum_or_abort(
                models.Analysis.priority,
                models.PriorityType,
                priority,
            )
        )
    result_path = request.args.get("result_path", type=str)
    if result_path:
        app.logger.debug("Filter by result_path: '%s'", result_path)
        filters.append(func.instr(models.Analysis.result_path, result_path))
    updated = request.args.get("updated", type=str)
    if updated:
        app.logger.debug("Filter by updated: '%s'", updated)
        filters.append(filter_updated_or_abort(models.Analysis.updated, updated))
    requested = request.args.get("requested", type=str)
    if requested:
        app.logger.debug("Filter by requested: '%s'", requested)
        filters.append(filter_updated_or_abort(models.Analysis.requested, requested))
    analysis_state = request.args.get("analysis_state", type=str)
    if analysis_state:
        app.logger.debug("Filter by analysis_state: '%s'", analysis_state)
        filters.append(
            filter_in_enum_or_abort(
                models.Analysis.analysis_state,
                models.AnalysisState,
                analysis_state,
            )
        )
    kind = request.args.get("kind", type=str)
    if kind:
        try:
            filters.append(models.Analysis.kind.in_(kind.split(",")))
        except ValueError as err:
            abort(400, description=err)
        app.logger.debug("Filter by kind: '%s'", kind)

    user = get_current_user()

    app.logger.debug("Querying and applying filters..")

    query = models.Analysis.query.options(
        selectinload(models.Analysis.datasets).options(
            selectinload(models.Dataset.tissue_sample).options(
                selectinload(models.TissueSample.participant).options(
                    selectinload(models.Participant.family)
                )
            )
        )
    ).filter(*filters)

    if assignee:
        query = query.join(assignee_user, models.Analysis.assignee)
    if requester:
        query = query.join(requester_user, models.Analysis.requester)
    if not user.is_admin:
        query = filter_datasets_by_user_groups(
            query.join(models.Analysis.datasets), user
        )

    participant_codename = request.args.get("participant_codename", type=str)
    if participant_codename:
        app.logger.debug(
            "Filtering by participant_codename: '%s' (subquery)", participant_codename
        )
        # use a subquery on one-to-many-related fields instead of eager/filter so that the related fields themselves aren't excluded
        # (we want all analyses that have at least 1 particpant that matches the search, along with *all* related participants)
        subquery = (
            models.Analysis.query.join(models.Analysis.datasets)
            .join(models.Dataset.tissue_sample)
            .join(models.TissueSample.participant)
            .filter(
                func.instr(
                    models.Participant.participant_codename, participant_codename
                )
            )
            .with_entities(models.Analysis.analysis_id)
            .subquery()
        )
        query = query.filter(
            models.Analysis.analysis_id.in_(select(subquery.c.analysis_id))
        )

    family_codename = request.args.get("family_codename", type=str)
    if family_codename:
        app.logger.debug(
            "Filtering by family_codename: '%s' (subquery)", family_codename
        )
        subquery = (
            models.Analysis.query.join(models.Analysis.datasets)
            .join(models.Dataset.tissue_sample)
            .join(models.TissueSample.participant)
            .join(models.Participant.family)
            .filter(func.instr(models.Family.family_codename, family_codename))
            .with_entities(models.Analysis.analysis_id)
            .subquery()
        )
        query = query.filter(
            models.Analysis.analysis_id.in_(select(subquery.c.analysis_id))
        )

    if request.args.get("search"):  # multifield search
        app.logger.debug(
            "Searching across multiple fields by '%s'", request.args.get("search")
        )
        subquery = (
            models.Analysis.query.join(models.Analysis.datasets)
            .join(models.Dataset.tissue_sample)
            .join(models.TissueSample.participant)
            .join(models.Participant.family)
            .filter(
                or_(
                    func.instr(
                        models.Family.family_codename, request.args.get("search")
                    ),
                    func.instr(
                        models.Family.family_aliases, request.args.get("search")
                    ),
                    func.instr(
                        models.Participant.participant_codename,
                        request.args.get("search"),
                    ),
                    func.instr(
                        models.Participant.participant_aliases,
                        request.args.get("search"),
                    ),
                )
            )
            .with_entities(models.Analysis.analysis_id)
            .subquery()
        )
        query = query.filter(
            models.Analysis.analysis_id.in_(select(subquery.c.analysis_id))
        )

    total_count = query.with_entities(
        func.count(distinct(models.Analysis.analysis_id))
    ).scalar()

    # this is needed to for sorting to work on assignee/requester
    query = (
        query.join(assignee_user, models.Analysis.assignee, isouter=True)
        if order_by == "assignee"
        else query
    )
    query = (
        query.join(requester_user, models.Analysis.requester)
        if order_by == "requester"
        else query
    )

    analyses = query.order_by(order).limit(limit).offset(page * (limit or 0)).all()

    app.logger.info("Query successful")

    results = [
        {
            **asdict(analysis),
            "sequencing_id": [d.sequencing_id for d in analysis.datasets],
            "participant_codenames": [
                d.tissue_sample.participant.participant_codename
                for d in analysis.datasets
            ],
            "family_codenames": [
                d.tissue_sample.participant.family.family_codename
                for d in analysis.datasets
            ],
            "requester": analysis.requester.username,
            "updated_by": analysis.updated_by.username,
            "assignee": analysis.assignee_id and analysis.assignee.username,
        }
        for analysis in analyses
    ]

    if expects_json(request):
        app.logger.debug("Returning paginated response..")
        return paginated_response(results, page, total_count, limit)
    elif expects_csv(request):
        app.logger.debug("Returning paginated response..")
        return csv_response(
            results,
            filename="analyses_report.csv",
            colnames=[
                "kind",
                "analysis_state",
                "participant_codenames",
                "family_codenames",
                "priority",
                "requester",
                "assignee",
                "updated",
                "result_path",
                "notes",
                "analysis_id",
                "sequencing_id",
            ],
        )

    abort(406, "Only 'text/csv' and 'application/json' HTTP accept headers supported")


@analyses_blueprint.route("/api/analyses/<int:id>", methods=["GET"])
@login_required
def get_analysis(id: int):

    user = get_current_user()

    query = models.Analysis.query.filter(models.Analysis.analysis_id == id)

    if not user.is_admin:
        query = filter_datasets_by_user_groups(
            query.join(models.Analysis.datasets), user
        )

    analysis = query.one_or_none()

    if not analysis:
        return abort(404)

    app.logger.debug("Query successful returning JSON..")

    return jsonify(
        {
            **asdict(analysis),
            "requester": analysis.requester_id and analysis.requester.username,
            "updated_by": analysis.updated_by_id and analysis.updated_by.username,
            "assignee": analysis.assignee_id and analysis.assignee.username,
            "datasets": [
                {
                    **asdict(dataset),
                    "linked_files": dataset.linked_files,
                    "group_code": [group.group_code for group in dataset.groups],
                    "tissue_sample_type": dataset.tissue_sample.tissue_sample_type,
                    "participant_codename": dataset.tissue_sample.participant.participant_codename,
                    "participant_type": dataset.tissue_sample.participant.participant_type,
                    "participant_aliases": dataset.tissue_sample.participant.participant_aliases,
                    "family_aliases": dataset.tissue_sample.participant.family.family_aliases,
                    "institution": dataset.tissue_sample.participant.institution.institution
                    if dataset.tissue_sample.participant.institution
                    else None,
                    "sex": dataset.tissue_sample.participant.sex,
                    "family_codename": dataset.tissue_sample.participant.family.family_codename,
                    "updated_by": dataset.tissue_sample.updated_by.username,
                    "created_by": dataset.tissue_sample.created_by.username,
                    "participant_notes": dataset.tissue_sample.participant.notes,
                }
                for dataset in analysis.datasets
            ],
        }
    )


analysis_schema = AnalysisSchema()


def start_any_pipelines(
    kind: str, analysis: models.Analysis, found_datasets: List[models.Dataset]
) -> bool:
    # Only automatically run pipeline if this is an exomic analysis on a trio or similar
    # This could be in one if conjunction but it is more clear when written out
    # For a list of kinds, see models.DATASET_TYPES
    if app.config["slurm"] and kind == "exomic":
        # and if all datasets have files
        if all(len(dataset.linked_files) for dataset in found_datasets):
            # and if each dataset is for a different participant
            distinct_participants = set(
                dataset.tissue_sample.participant_id for dataset in found_datasets
            )
            if len(distinct_participants) == len(found_datasets):
                distinct_families = set(
                    dataset.tissue_sample.participant.family_id
                    for dataset in found_datasets
                )
                if len(distinct_families) == 1:
                    job = run_crg2_on_family(analysis)
                    if job:
                        analysis.scheduler_id = job.job_id
                        analysis.analysis_state = models.AnalysisState.Running
                        # Automated jobs can be assigned to default admin
                        analysis.assignee_id = 1
                        # Use a slightly different timestamp
                        analysis.started = datetime.now()
                        try:
                            db.session.commit()
                            return True
                        except Exception as e:
                            db.session.rollback()
                            app.logger.warn(
                                f"Failed to save scheduler_id {job.job_id} for analysis {analysis.analysis_id}",
                                exc_info=e,
                            )
    return False


@analyses_blueprint.route("/api/analyses", methods=["POST"])
@login_required
@validate_json
def create_analysis():

    new_analysis = validate_filter_input(request.json, models.Analysis)

    result = analysis_schema.validate(new_analysis, session=db.session)

    if result:
        app.logger.error(result)
        abort(400, description=result)

    datasets = request.json.get("datasets")
    notes = request.json.get("notes")

    user = get_current_user()

    requester_id = updated_by_id = user.user_id

    found_datasets_query = models.Dataset.query.filter(
        models.Dataset.dataset_id.in_(datasets)
    ).options(  # These are only used after the transaction but it's more convenient to query for them at once
        joinedload(models.Dataset.linked_files),
        joinedload(models.Dataset.tissue_sample)
        .joinedload(models.TissueSample.participant)
        .joinedload(models.Participant.family),
    )

    if not user.is_admin:
        found_datasets_query = filter_datasets_by_user_groups(
            found_datasets_query, user
        )

    found_datasets = found_datasets_query.all()

    if len(found_datasets) != len(datasets):
        abort(404, description="Some datasets were not found")

    kinds = set(models.DATASET_TYPES[d.dataset_type]["kind"] for d in found_datasets)
    if len(kinds) != 1:
        abort(400, description="The dataset types must agree")
    kind = kinds.pop()

    now = datetime.now()
    analysis = models.Analysis(
        analysis_state="Requested",
        kind=kind,
        priority=request.json.get("priority"),
        requester_id=requester_id,
        requested=now,
        updated=now,
        updated_by_id=updated_by_id,
        datasets=found_datasets,
        notes=notes,
    )

    db.session.add(analysis)
    transaction_or_abort(db.session.commit)

    start_any_pipelines(kind, analysis, found_datasets)

    # TODO: inspect this response payload; it is causing several additional queries
    return (
        jsonify(
            {
                **asdict(analysis),
                "requester": analysis.requester_id and analysis.requester.username,
                "updated_by": analysis.updated_by_id and analysis.updated_by.username,
                "assignee": analysis.assignee_id and analysis.assignee.username,
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


@analyses_blueprint.route("/api/analyses/<int:id>", methods=["POST"])
@login_required
def create_reanalysis(id: int):
    app.logger.info(f"Checking if analysis {id} exists...")
    analysis = models.Analysis.query.filter(
        models.Analysis.analysis_id == id
    ).first_or_404()

    datasets = [dataset.dataset_id for dataset in analysis.datasets]

    user = get_current_user()

    if app.config.get("LOGIN_DISABLED"):
        requester_id = updated_by_id = user.user_id
    else:
        requester_id = updated_by_id = user.user_id

    found_datasets_query = models.Dataset.query.filter(
        models.Dataset.dataset_id.in_(datasets)
    )

    if not user.is_admin:
        found_datasets_query = filter_datasets_by_user_groups(
            found_datasets_query, user
        )

    found_datasets = found_datasets_query.all()

    if len(found_datasets) != len(datasets):
        abort(404, description="Some datasets were not found")

    # TODO: Do we need to check for compatibility if the previous analysis already exists?

    app.logger.info("Cloning previous analysis...")
    # Clone attributes from existing analysis, overwrite some
    now = datetime.now()
    new_analysis = clone_entity(
        analysis,
        analysis_state="Requested",
        requested=now,
        updated=now,
        requester_id=requester_id,
        updated_by_id=updated_by_id,
        notes=f"Reanalysis of analysis ID {id}",
        datasets=found_datasets,
    )

    db.session.add(new_analysis)
    transaction_or_abort(db.session.commit)

    return (
        jsonify(
            {
                **asdict(new_analysis),
                "requester": new_analysis.requester_id
                and new_analysis.requester.username,
                "updated_by": new_analysis.updated_by_id
                and new_analysis.updated_by.username,
                "assignee": new_analysis.assignee_id and new_analysis.assignee.username,
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
                    for dataset in new_analysis.datasets
                ],
            }
        ),
        201,
        {"location": f"/api/analyses/{new_analysis.analysis_id}"},
    )


@analyses_blueprint.route("/api/analyses/<int:id>/run", methods=["POST"])
@login_required
@check_admin
@validate_json
def retroactively_run_pipeline(id: int):
    analysis = (
        models.Analysis.query.filter(models.Analysis.analysis_id == id)
        .options(
            joinedload(models.Analysis.datasets)
            .joinedload(models.Dataset.linked_files),
            joinedload(models.Analysis.datasets)
            .joinedload(models.Dataset.tissue_sample)
            .joinedload(models.TissueSample.participant)
            .joinedload(models.Participant.family),
        )
        .first_or_404()
    )
    if analysis.analysis_state != models.AnalysisState.Requested:
        abort(400, description=f"State: {analysis.analysis_state}")
    kinds = set(models.DATASET_TYPES[d.dataset_type]["kind"] for d in analysis.datasets)
    if len(kinds) != 1:
        abort(400, description="The dataset types must agree")
    kind = kinds.pop()
    if start_any_pipelines(kind, analysis, analysis.datasets):
        return Response(status=202)  # Accepted
    abort(400)


@analyses_blueprint.route("/api/analyses/<int:id>", methods=["DELETE"])
@login_required
@check_admin
def delete_analysis(id: int):
    app.logger.debug(f"Checking if analysis {id} exists..")
    analysis = models.Analysis.query.filter(
        models.Analysis.analysis_id == id
    ).first_or_404()

    try:
        db.session.delete(analysis)
        db.session.commit()
        app.logger.debug("Deletion successful")
        return "Updated", 204
    except:
        db.session.rollback()
        abort(500)


@analyses_blueprint.route("/api/analyses/<int:id>", methods=["PATCH"])
@login_required
@validate_json
def update_analysis(id: int):

    app.logger.debug("Getting user_id..")

    user = get_current_user()

    if not user.is_admin and request.json.get("analysis_state") not in [
        "Cancelled",
        None,  # account for default
    ]:
        abort(
            403,
            description="Analysis state changes are restricted to administrators",
        )

    query = models.Analysis.query.filter(models.Analysis.analysis_id == id)

    if not user.is_admin:
        query = filter_datasets_by_user_groups(
            query.join(models.Analysis.datasets), user
        )

    analysis = query.first_or_404()

    editable_columns = [
        "analysis_state",
        "scheduler_id",
        "result_path",
        "requested",
        "started",
        "finished",
        "notes",
        "priority",
    ]

    app.logger.debug("Validating assignee parameter..")

    if "assignee" in request.json:
        if not request.json["assignee"]:
            analysis.assignee = None
        else:
            assignee = models.User.query.filter(
                models.User.username == request.json["assignee"]
            ).first()
            if assignee:
                analysis.assignee = assignee
            else:
                abort(400, description="Assignee not found")

    validate_enums_and_set_fields(analysis, request.json, editable_columns)

    app.logger.debug("Validating other fields..")

    analysis.updated_by_id = user.user_id

    if request.json.get("analysis_state") == "Running":
        analysis.started = datetime.now()
    elif request.json.get("analysis_state") == "Done":
        analysis.finished = datetime.now()
    # Error and Cancelled defaults to time set in 'updated'

    transaction_or_abort(db.session.commit)

    app.logger.debug("Update successful, returning JSON..")

    return jsonify(
        {
            **asdict(analysis),
            "assignee": analysis.assignee_id and analysis.assignee.username,
            "requester": analysis.requester_id and analysis.requester.username,
            "updated_by_id": analysis.updated_by_id and analysis.updated_by.username,
        }
    )
