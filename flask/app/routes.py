import inspect
from dataclasses import asdict
from datetime import datetime
from enum import Enum
from io import StringIO

import pandas as pd
from flask import current_app as app, jsonify, Response, request, Blueprint
from flask_login import current_user, login_required, login_user, logout_user
from sqlalchemy.orm import aliased, contains_eager, joinedload
from werkzeug.exceptions import HTTPException

from .extensions import db, login
from . import models

from .utils import check_admin, transaction_or_abort, enum_validate

routes = Blueprint("routes", __name__)


@login.user_loader
def load_user(uid: int):
    return models.User.query.get(uid)


@routes.route("/api/login", methods=["POST"])
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

        return jsonify(
            {
                "username": current_user.username,
                "last_login": last_login,
                "is_admin": current_user.is_admin,
            }
        )

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
    return jsonify(
        {
            "username": user.username,
            "last_login": last_login,
            "is_admin": current_user.is_admin,
        }
    )


@routes.route("/api/logout", methods=["POST"])
@login_required
def logout():
    if not request.json:
        return "Request body must be JSON!", 400
    logout_user()
    return "", 204


@routes.errorhandler(HTTPException)
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


@routes.route("/api/users", methods=["PUT"])
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


@routes.route("/api/password", methods=["POST"])
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


@routes.route("/api/pipelines", methods=["GET"], endpoint="pipelines_list")
@login_required
def pipelines_list():
    db_pipelines = (
        db.session.query(models.Pipeline)
        .options(joinedload(models.Pipeline.supported))
        .all()
    )

    return jsonify(db_pipelines)


@routes.route("/api/enums", methods=["GET"])
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


@routes.route("/api/_bulk", methods=["POST"])
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

    if request.content_type == "text/csv":
        try:
            dat = pd.read_csv(StringIO(request.data.decode("utf-8")))
            dat = dat.where(pd.notnull(dat), None)
            dat = dat.to_dict(orient="records")
        except Exception as err:
            return str(err), 400

    elif request.content_type == "application/json":
        if not request.json:
            return "Request body must be JSON", 415

        # the jsons must be in a list, even if it is a single json object
        if not isinstance(request.json, list):
            return "JSON must be in an array", 422

        dat = request.json

    else:
        return "Only Content Type 'text/csv' or 'application/json' Supported", 415

    try:
        updated_by_id = current_user.user_id
        created_by_id = current_user.user_id
    except:  # LOGIN_DISABLED
        updated_by_id = 1
        created_by_id = 1

    # get all group codes present in db
    all_groups = models.Group.query.all()
    all_codes = [g.group_code for g in all_groups]

    # get user's group(s)
    group_query = request.args.get("group")

    if app.config.get("LOGIN_DISABLED"):
        user_id = request.args.get("user")
        if user_id:
            user_group = (
                models.Group.query.join(models.Group.users)
                .filter(models.User.user_id == user_id)
                .all()
            )
        else:
            user_group = all_groups
    elif current_user.is_admin:
        user_group = all_groups
    else:
        user_id = current_user.user_id
        user_group = (
            models.Group.query.join(models.Group.users)
            .filter(models.User.user_id == user_id)
            .all()
        )

    if not user_group:
        return "User does not belong to any permission groups", 403

    if group_query:
        group_query = group_query.split(",")
        codes = [code.group_code for code in user_group]
        for g in group_query:
            if g not in all_codes:
                return f"Group {g} does not exist", 404
            if g not in codes:
                return f"User does not belong to group {g}", 403
    else:
        if len(user_group) != 1:
            return (
                "User belongs to multiple permission groups but no group was specified",
                400,
            )

    for i, row in enumerate(dat):
        sequencing_date = row.get("sequencing_date")
        if not sequencing_date:
            return "A sequencing date must be provided", 400

        # Find the family by codename or create it if it doesn't exist
        family_id = models.Family.query.filter(
            models.Family.family_codename == row.get("family_codename")
        ).value("family_id")
        if not family_id:
            family = models.Family(
                family_codename=row.get("family_codename"),
                created_by_id=created_by_id,
                updated_by_id=updated_by_id,
            )
            db.session.add(family)
            transaction_or_abort(db.session.flush)
            family_id = family.family_id

        # Fail if we have any invalid values
        enum_error = enum_validate(
            models.Participant, row, editable_dict["participant"]
        )
        if enum_error:
            db.session.rollback()
            return f"Error on line {str(i + 1)} - " + enum_error, 400

        # Find the participant by codename or create it if it doesn't exist
        participant_id = models.Participant.query.filter(
            models.Participant.family_id == family_id,
            models.Participant.participant_codename == row.get("participant_codename"),
        ).value("participant_id")
        if not participant_id:
            participant = models.Participant(
                family_id=family_id,
                participant_codename=row.get("participant_codename"),
                sex=row.get("sex"),
                notes=row.get("notes"),
                affected=row.get("affected"),
                solved=row.get("solved"),
                participant_type=row.get("participant_type"),
                month_of_birth=row.get("month_of_birth"),
                created_by_id=created_by_id,
                updated_by_id=updated_by_id,
            )
            db.session.add(participant)
            transaction_or_abort(db.session.flush)
            participant_id = participant.participant_id

        # Fail if we have any invalid values
        enum_error = enum_validate(
            models.TissueSample, row, editable_dict["tissue_sample"]
        )
        if enum_error:
            db.session.rollback()
            return f"Error on line {str(i + 1)}: " + enum_error, 400

        # Create a new tissue sample under this participant
        tissue_sample = models.TissueSample(
            participant_id=participant_id,
            tissue_sample_type=row.get("tissue_sample_type"),
            notes=row.get("notes"),
            created_by_id=created_by_id,
            updated_by_id=updated_by_id,
        )
        db.session.add(tissue_sample)
        transaction_or_abort(db.session.flush)

        # Fail if we have any invalid values
        enum_error = enum_validate(models.Dataset, row, editable_dict["dataset"])
        if enum_error:
            db.session.rollback()
            return f"Error on line {str(i + 1)} - " + enum_error, 400

        # Create a new dataset under the new tissue sample
        dataset = models.Dataset(
            tissue_sample_id=tissue_sample.tissue_sample_id,
            dataset_type=row.get("dataset_type"),
            created_by_id=created_by_id,
            updated_by_id=updated_by_id,
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
        if request.content_type == "text/csv":
            files = row.get("linked_files", "").split("|")
        else:
            files = row.get("linked_files", [])
        dataset.files += [models.DatasetFile(path=path) for path in files if path]
        for g in user_group:
            dataset.groups.append(g)
        db.session.add(dataset)
        transaction_or_abort(db.session.flush)
        dataset_ids.append(dataset.dataset_id)

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
