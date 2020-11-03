from datetime import datetime
from enum import Enum
from functools import wraps
import json
from typing import Any, Callable, Dict, List, Union
from dataclasses import asdict
import inspect
from io import StringIO

from . import db, login, models

from flask import abort, jsonify, request, Response, current_app as app
from flask_login import login_user, logout_user, current_user, login_required
from sqlalchemy import exc
from sqlalchemy.orm import aliased, joinedload
from werkzeug.exceptions import HTTPException
import pandas as pd


@login.user_loader
def load_user(uid: int):
    return models.User.query.get(uid)


@app.route("/api/login", methods=["POST"])
def login():
    last_login = None
    if current_user.is_authenticated:
        # get/update last login
        try:
            last_login = current_user.last_login
            current_user.last_login = datetime.now()
            db.session.commit()
        except:
            app.logger.warning(
                "Failed to updated last_login for %s", current_user.username
            )

        return jsonify({"username": current_user.username, "last_login": last_login})

    body = request.json
    if not body or "username" not in body or "password" not in body:
        return "Request body must be correctly-shaped JSON!", 400

    user = models.User.query.filter_by(username=body["username"]).first()
    if user is None or not user.check_password(body["password"]):
        return "Unauthorized", 401

    # get/update last login
    try:
        last_login = user.last_login
        user.last_login = datetime.now()
        db.session.commit()
    except:
        app.logger.warning("Failed to updated last_login for %s", user.username)

    login_user(user)
    return jsonify({"username": user.username, "last_login": last_login})


@app.route("/api/logout", methods=["POST"])
@login_required
def logout():
    if not request.json:
        return "Request body must be JSON!", 400
    logout_user()
    return "", 204


def check_admin(handler):
    @wraps(handler)
    def decorated_handler(*args, **kwargs):
        if False:
            return "Unauthorized", 401
        return handler(*args, **kwargs)

    return decorated_handler


def transaction_or_abort(callback: Callable) -> None:
    try:
        callback()
    except exc.DataError as err:
        db.session.rollback()
        abort(400, description=err.orig.args[1])
    except exc.StatementError as err:
        db.session.rollback()
        abort(400, description=str(err.orig))
    except Exception as err:
        db.session.rollback()
        raise err


@app.errorhandler(HTTPException)
def on_http_exception(error: HTTPException) -> Response:
    response = error.get_response()
    response.content_type = "text/plain"
    response.data = error.description
    return response


def validate_user(request_user: dict):
    if "username" in request_user:
        if "password" in request_user and len(request_user["password"]):
            return (
                "confirmPassword" in request_user
                and request_user["password"] == request_user["confirmPassword"]
            )
        return True
    return False


@app.route("/api/users", methods=["GET"])
@login_required
@check_admin
def user_list():
    db_users = db.session.query(models.User).all()
    users = [
        {"username": user.username, "email": user.email, "isAdmin": True}
        for user in db_users
    ]
    return json.dumps(users)


@app.route("/api/users", methods=["POST"])
@login_required
@check_admin
def create_user():
    rq_user = request.get_json()
    if not validate_user(rq_user):
        return "Bad request", 400

    db_user = models.User.query.filter_by(username=rq_user["username"]).first()
    if db_user is not None:
        return "User already exists", 403

    if "password" not in rq_user or "email" not in rq_user:
        return "Bad request", 400

    user = models.User(username=rq_user["username"], email=rq_user["email"])
    user.set_password(rq_user["password"])
    db.session.add(user)
    try:
        db.session.commit()
        return "Created", 201
    except:
        db.session.rollback()
        return "Server error", 500


@app.route("/api/users", methods=["PUT"])
@login_required
@check_admin
def update_user():
    rq_user = request.get_json()
    if not validate_user(rq_user):
        return "Bad request", 400

    db_user = models.User.query.filter_by(username=rq_user["username"]).first_or_404()
    if "password" in rq_user and len(rq_user["password"]):
        db_user.set_password(rq_user["password"])
    if "email" in rq_user:
        db_user.email = rq_user["email"]

    try:
        db.session.commit()
        return "Updated", 204
    except:
        db.session.rollback()
        return "Server error", 500


@app.route("/api/users", methods=["DELETE"])
@login_required
@check_admin
def delete_user():
    rq_user = request.get_json()
    if not validate_user(rq_user):
        return "Bad request", 400

    db_user = models.User.query.filter_by(username=rq_user["username"]).first_or_404()
    try:
        db.session.delete(db_user)
        db.session.commit()
        return "Updated", 204
    except:
        db.session.rollback()
        return "Server error", 500


@app.route("/api/password", methods=["POST"])
@login_required
def change_password():
    params = request.get_json()
    if "current" not in params or "password" not in params or "confirm" not in params:
        return "Bad request", 400

    if params["password"] != params["confirm"]:
        return "Passwords do not match", 400

    if not current_user.check_password(params["current"]):
        return "Incorrect password", 401

    current_user.set_password(params["password"])
    try:
        db.session.commit()
        return "Updated", 204
    except:
        db.session.rollback()
        return "Server error", 500


def mixin(
    entity: db.Model, json_mixin: Dict[str, Any], columns: List[str]
) -> Union[None, str]:
    for field in columns:
        if field in json_mixin:
            column = getattr(entity, field)
            value = json_mixin[field]
            if isinstance(column, Enum):
                if not hasattr(type(column), str(value)):
                    allowed = [e.value for e in type(column)]
                    return f'"{field}" must be one of {allowed}'
            setattr(entity, field, value)


@app.route("/api/<model_name>/<int:id>", methods=["PATCH"])
@login_required
def update_entity(model_name: str, id: int):
    if not request.json:
        return "Request body must be JSON", 415

    if model_name == "participants":
        table = models.Participant.query.get(id)
        editable_columns = [
            "participant_codename",
            "sex",
            "participant_type",
            "affected",
            "solved",
            "notes",
        ]
    elif model_name == "datasets":
        table = models.Dataset.query.get(id)
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
    elif model_name == "analyses":
        table = models.Analysis.query.get(id)
        editable_columns = [
            "analysis_state",
            "pipeline_id",
            "qsub_id",
            "result_hpf_path",
            "requested",
            "started",
            "finished",
            "notes",
        ]
        if "assignee" in request.json:
            if not request.json["assignee"]:
                table.assignee = None
            else:
                assignee = models.User.query.filter(
                    models.User.username == request.json["assignee"]
                ).first()
                if assignee:
                    table.assignee = assignee.user_id
                else:
                    return "assignee not found", 400
    else:
        return "Not Found", 404

    if not table:
        return "Not Found", 404

    enum_error = mixin(table, request.json, editable_columns)

    if enum_error:
        return enum_error, 400

    try:
        table.updated_by = current_user.user_id
    except:
        pass  # LOGIN_DISABLED

    transaction_or_abort(db.session.commit)

    if model_name == "analyses":
        return jsonify(
            {
                **asdict(table),
                "assignee": table.assignee_user and table.assignee_user.username,
                "requester": table.requester_user and table.requester_user.username,
                "updated_by": table.updated_by_user and table.updated_by_user.username,
            }
        )
    return jsonify(table)


@app.route("/api/participants", methods=["GET"], endpoint="participants_list")
@login_required
def participants_list():
    db_participants = models.Participant.query.options(
        joinedload(models.Participant.family),
        joinedload(models.Participant.tissue_samples).joinedload(
            models.TissueSample.datasets
        ),
    ).all()

    participants = [
        {
            **asdict(participant),
            "family_codename": participant.family.family_codename,
            "tissue_samples": [
                {**asdict(tissue_sample), "datasets": tissue_sample.datasets}
                for tissue_sample in participant.tissue_samples
            ],
        }
        for participant in db_participants
    ]
    return jsonify(participants)


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


@app.route("/api/pipelines", methods=["GET"], endpoint="pipelines_list")
@login_required
def pipelines_list():
    db_pipelines = (
        db.session.query(models.Pipeline)
        .options(joinedload(models.Pipeline.supported))
        .all()
    )

    return jsonify(db_pipelines)


@app.route("/api/datasets", methods=["GET"])
@login_required
def datasets_list():
    db_datasets = (
        db.session.query(models.Dataset)
        .options(
            joinedload(models.Dataset.tissue_sample)
            .joinedload(models.TissueSample.participant)
            .joinedload(models.Participant.family)
        )
        .all()
    )
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


@app.route("/api/enums", methods=["GET"])
@login_required
def get_enums():
    enums = {}
    for name, obj in inspect.getmembers(models, inspect.isclass):
        if issubclass(obj, Enum) and name != "Enum":
            enums[name] = [e.value for e in getattr(models, name)]
        # cheat to also return the DatasetType and MetaDatasetType
        if name == "DatasetType":
            enums[name] = [
                e.dataset_type for e in db.session.query(getattr(models, name)).all()
            ]
        elif name == "MetaDatasetType":
            enums[name] = [
                e.metadataset_type
                for e in db.session.query(getattr(models, name)).all()
            ]

    return jsonify(enums)


def enum_validate(
    entity: db.Model, json_mixin: Dict[str, any], columns: List[str]
) -> Union[None, str]:

    for field in columns:
        if field in json_mixin:
            column = getattr(entity, field)  # the column type from the entities
            value = json_mixin[field]
            if hasattr(column.type, "enums"):  # check if enum
                if value not in column.type.enums and value is not None:
                    allowed = column.type.enums
                    return f'Invalid value for: "{field}", current input is "{value}" but must be one of {allowed}'


@app.route("/api/_bulk", methods=["POST"])
@login_required
def bulk_update():

    dataset_ids = []

    editable_dict = {
        "participant": [
            "participant_codename",
            "sex",
            "participant_type",
            "month_of_birth",
            "affected",
            "solved",
            "notes",
        ],
        "dataset": [
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
        ],
        "tissue_sample": [
            "extraction_date",
            "tissue_sample_type",
            "tissue_processing",
            "notes",
        ],
    }

    if request.content_type != "text/csv":
        return "Only Content Type 'text/csv' Supported", 415
    else:

        try:
            dat = pd.read_csv(StringIO(request.data.decode("utf-8")))
            dat = dat.where(pd.notnull(dat), None)
        except Exception as err:
            return str(err), 400
    try:
        updated_by = current_user.user_id
        created_by = current_user.user_id
    except:  # LOGIN_DISABLED
        updated_by = 1
        created_by = 1

    for i, row in enumerate(dat.to_dict(orient="records")):

        # family logic

        fam_query = models.Family.query.filter(
            models.Family.family_codename == row.get("family_codename")
        )

        if not fam_query.value("family_id"):

            fam_objs = models.Family(
                family_codename=row.get("family_codename"),
                created_by=created_by,
                updated_by=updated_by,
            )
            db.session.add(fam_objs)

            transaction_or_abort(db.session.flush)

        # participant logic

        # query both participant codename and family id else we will get the participant ID for the first member
        # of the family and no subsequent entities will be updated
        ptp_query = models.Participant.query.filter(
            models.Participant.family_id == fam_query.value("family_id"),
            models.Participant.participant_codename == row.get("participant_codename"),
        )

        enum_error = enum_validate(
            models.Participant, row, editable_dict["participant"]
        )

        if enum_error:
            return f"Error on line {str(i + 1)} - " + enum_error, 400

        ptp_objs = models.Participant(
            family_id=fam_query.value("family_id"),
            participant_codename=row.get("participant_codename"),
            sex=row.get("sex"),
            notes=row.get("notes"),
            affected=row.get("affected"),
            solved=row.get("solved"),
            participant_type=row.get("participant_type"),
            month_of_birth=row.get("month_of_birth"),
            created_by=created_by,
            updated_by=updated_by,
        )

        db.session.add(ptp_objs)
        transaction_or_abort(db.session.flush)

        # tissue logic

        tis_query = models.TissueSample.query.filter(
            models.TissueSample.participant_id == ptp_query.value("participant_id")
        )

        if not tis_query.value("tissue_sample_id"):

            enum_error = enum_validate(
                models.TissueSample, row, editable_dict["tissue_sample"]
            )

            if enum_error:
                return f"Error on line {str(i + 1)}: " + enum_error, 400

            tis_objs = models.TissueSample(
                participant_id=ptp_query.value("participant_id"),
                tissue_sample_type=row.get("tissue_sample_type"),
                notes=row.get("notes"),
                created_by=created_by,
                updated_by=updated_by,
            )
            db.session.add(tis_objs)
            transaction_or_abort(db.session.flush)

        # dataset logic

        dts_query = models.Dataset.query.filter(
            models.Dataset.tissue_sample_id == tis_query.value("tissue_sample_id")
        )

        if not dts_query.value("dataset_id"):

            enum_error = enum_validate(models.Dataset, row, editable_dict["dataset"])

            if enum_error:
                return f"Error on line {str(i + 1)} - " + enum_error, 400

            dts_objs = models.Dataset(
                tissue_sample_id=tis_query.value("tissue_sample_id"),
                dataset_type=row.get("dataset_type"),
                created_by=created_by,
                updated_by=updated_by,
                condition=row.get("condition"),
                extraction_protocol=row.get("extraction_protocol"),
                capture_kit=row.get("capture_kit"),
                library_prep_method=row.get("library_prep_method"),
                read_length=row.get("read_length"),
                read_type=row.get("read_type"),
                sequencing_centre=row.get("sequencing_centre"),
                sequencing_date=row.get("sequencing_date"),
                batch_id=row.get("batch_id"),
            )
            db.session.add(dts_objs)
            transaction_or_abort(db.session.flush)

        dataset_ids.append(dts_query.value("dataset_id"))

    transaction_or_abort(db.session.commit)

    db_datasets = (
        db.session.query(models.Dataset)
        .options(
            joinedload(models.Dataset.tissue_sample)
            .joinedload(models.TissueSample.participant)
            .joinedload(models.Participant.family)
        )
        .filter(models.Dataset.dataset_id.in_(dataset_ids))
        .all()
    )

    datasets = [
        {
            **asdict(dataset),
            "tissue_sample_type": dataset.tissue_sample.tissue_sample_type,
            "participant_codename": dataset.tissue_sample.participant.participant_codename,
            "participant_type": dataset.tissue_sample.participant.participant_type,
            "sex": dataset.tissue_sample.participant.sex,
            "family_codename": dataset.tissue_sample.participant.family.family_codename,
            "month_of_birth": dataset.tissue_sample.participant.month_of_birth,
        }
        for dataset in db_datasets
    ]

    return jsonify(datasets)


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
    transaction_or_abort(db.session.flush)

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

    transaction_or_abort(db.session.commit)

    return jsonify(obj)


@app.route("/api/tissue_samples/<int:id>", methods=["GET"])
@login_required
def get_tissue_sample(id: int):
    tissue_sample = (
        models.TissueSample.query.filter_by(tissue_sample_id=id)
        .options(joinedload(models.TissueSample.datasets))
        .one_or_none()
    )
    if not tissue_sample:
        return "Not Found", 404
    else:
        return jsonify(
            {
                **asdict(tissue_sample),
                "datasets": tissue_sample.datasets,
            }
        )
