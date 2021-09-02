from dataclasses import asdict
from datetime import datetime

from flask_login import login_required
from sqlalchemy import distinct, func, or_
from sqlalchemy.orm import aliased, selectinload

from flask import Blueprint, Response, abort, current_app as app, jsonify, request

from . import models
from .extensions import db
from .utils import (
    check_admin,
    clone_entity,
    csv_response,
    enum_validate,
    expects_csv,
    expects_json,
    filter_datasets_by_user_groups,
    filter_in_enum_or_abort,
    filter_updated_or_abort,
    get_current_user,
    mixin,
    paged,
    paginated_response,
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

    app.logger.debug("Parsing query parameters..")

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
        app.logger.debug("Filter by pipeline_id: '%s'", pipeline_id)

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
        query = query.filter(models.Analysis.analysis_id.in_(subquery))

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
        query = query.filter(models.Analysis.analysis_id.in_(subquery))

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
        query = query.filter(models.Analysis.analysis_id.in_(subquery))

    total_count = query.with_entities(
        func.count(distinct(models.Analysis.analysis_id))
    ).scalar()
    analyses = query.order_by(order).limit(limit).offset(page * (limit or 0)).all()

    app.logger.info("Query successful")

    results = [
        {
            **asdict(analysis),
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
            "pipeline": analysis.pipeline,
        }
        for analysis in analyses
    ]

    if expects_json(request):
        app.logger.debug("Returning paginated response..")
        return paginated_response(results, page, total_count, limit)
    elif expects_csv(request):
        app.logger.debug("Returning paginated response..")

        results = [
            {k: v if k != "pipeline" else v.pipeline_name for k, v in result.items()}
            for result in results
        ]

        return csv_response(
            results,
            filename="analyses_report.csv",
            colnames=[
                "pipeline",
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
            "pipeline": analysis.pipeline,
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
                }
                for dataset in analysis.datasets
            ],
        }
    )


@analyses_blueprint.route("/api/analyses", methods=["POST"])
@login_required
@validate_json
def create_analysis():

    app.logger.debug("Validating pipeline_id parameter..")
    pipeline_id = request.json.get("pipeline_id")
    if not isinstance(pipeline_id, int):
        abort(400, description="Missing pipeline_id field or invalid type")

    app.logger.debug("Validating datasets parameter..")
    datasets = request.json.get("datasets")
    if not (isinstance(datasets, list) and len(datasets)):
        abort(400, description="Missing datasets field or invalid type")

    app.logger.debug("Validating notes parameter..")
    notes = request.json.get("notes")
    if notes and not isinstance(notes, str):
        abort(400, description="Invalid notes type")

    if not models.Pipeline.query.get(pipeline_id):
        abort(404, description="Pipeline not found")

    app.logger.debug("Validating priority parameter..")

    enum_error = enum_validate(models.Analysis, request.json, ["priority"])

    if enum_error:
        abort(400, description=enum_error)

    user = get_current_user()

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

    app.logger.debug(
        "Verifying that requested datasets are compatible with requested pipeline.."
    )

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

    app.logger.debug("Creating analysis..")

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
        notes=notes,
    )

    db.session.add(analysis)
    transaction_or_abort(db.session.commit)

    app.logger.debug("Analysis created successfully, returning JSON..")

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
    app.logger.info(
        f"Checking if datasets are still compatible with pipeline {analysis.pipeline_id}..."
    )
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
        .filter(models.PipelineDatasets.pipeline_id == analysis.pipeline_id)
        .all()
    )

    if len(compatible_datasets_pipelines_query) != len(datasets):
        abort(404, description="Requested pipelines are incompatible with datasets")

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

    app.logger.debug("Analysis creation successful, returning JSON..")

    return (
        jsonify(
            {
                **asdict(new_analysis),
                "requester": new_analysis.requester_id
                and new_analysis.requester.username,
                "updated_by": new_analysis.updated_by_id
                and new_analysis.updated_by.username,
                "assignee": new_analysis.assignee_id and new_analysis.assignee.username,
                "pipeline": new_analysis.pipeline,
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
        "pipeline_id",
        "qsub_id",
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

    enum_error = enum_validate(models.Analysis, request.json, editable_columns)

    if enum_error:
        abort(400, description=enum_error)

    app.logger.debug("Validating other fields..")

    mixin(analysis, request.json, editable_columns)

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
