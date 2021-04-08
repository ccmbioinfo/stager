from dataclasses import asdict
from datetime import datetime
from enum import Enum
import inspect
from io import StringIO

from flask import Blueprint, abort, current_app as app, jsonify, request
from flask_login import current_user, login_required, login_user, logout_user
import pandas as pd
from sqlalchemy.orm import joinedload

from . import models
from .extensions import db
from .utils import enum_validate, transaction_or_abort, validate_json

routes = Blueprint("routes", __name__)


@routes.route("/api")
def version():
    return jsonify({"sha": app.config.get("GIT_SHA")})


@routes.route("/api/login", methods=["POST"])
def login():
    last_login = None
    app.logger.info("Checking whether user is authenticated")
    if current_user.is_authenticated:
        # get/update last login
        app.logger.info("User is authenticated, updating last login..")
        try:
            last_login = current_user.last_login
            current_user.last_login = datetime.now()
            db.session.commit()
            app.logger.info("Last login for '%s' updated..", current_user.username)
        except:
            app.logger.warning(
                "Failed to updated last_login for '%s'", current_user.username
            )

        return jsonify(
            {
                "username": current_user.username,
                "last_login": last_login,
                "is_admin": current_user.is_admin,
                "groups": [group.group_code for group in current_user.groups],
            }
        )
    app.logger.debug("Checking request body")
    body = request.json
    if not body or "username" not in body or "password" not in body:
        app.logger.error("Request body is not JSON")
        abort(400, description="Request body must be correctly-shaped JSON!")

    app.logger.debug("Checking user is authorized..")
    user = models.User.query.filter_by(username=body["username"]).first()
    if user is None or user.deactivated or not user.check_password(body["password"]):
        app.logger.error("Unauthorized user")
        abort(401, description="Unauthorized")

    # get/update last login
    try:
        last_login = user.last_login
        user.last_login = datetime.now()
        db.session.commit()
    except:
        app.logger.warning("Failed to update last_login for '%s'", user.username)

    login_user(user)
    app.logger.info(
        "User '%s' has successfully logged in, returning JSON.", user.username
    )
    return jsonify(
        {
            "username": user.username,
            "last_login": last_login,
            "is_admin": current_user.is_admin,
            "groups": [group.group_code for group in current_user.groups],
        }
    )


@routes.route("/api/logout", methods=["POST"])
@login_required
@validate_json
def logout():
    logout_user()
    return "", 204


def validate_user(request_user: dict):
    if "username" in request_user:
        if "password" in request_user and len(request_user["password"]):
            return (
                "confirmPassword" in request_user
                and request_user["password"] == request_user["confirmPassword"]
            )
        return True
    return False


@routes.route("/api/pipelines", methods=["GET"], endpoint="pipelines_list")
@login_required
def pipelines_list():
    app.logger.info("Retrieving all pipelines..")
    db_pipelines = (
        db.session.query(models.Pipeline)
        .options(joinedload(models.Pipeline.supported))
        .all()
    )
    app.logger.info("Returning pipelines as JSON..")
    return jsonify(db_pipelines)


@routes.route("/api/institutions", methods=["GET"])
@login_required
def get_institutions():
    app.logger.info("Retrieving all institutions..")
    db_institutions = models.Institution.query.all()
    app.logger.info("Returning institutions as JSON..")
    return jsonify([x.institution for x in db_institutions])


@routes.route("/api/metadatasettypes", methods=["GET"])
@login_required
def get_metadataset_types():
    app.logger.info("Retrieving all metadataset types..")
    metadataset_dataset_types = models.MetaDatasetType_DatasetType.query.all()
    app.logger.debug("Creating a dictionary of unique metadataset types")
    d = {e.metadataset_type: [] for e in metadataset_dataset_types}
    app.logger.debug("Appending dataset types to each unique metadataset type")
    for k in metadataset_dataset_types:
        app.logger.debug("Appending '%s' to '%s'", k.dataset_type, k.metadataset_type)
        d[k.metadataset_type].append(k.dataset_type)
    app.logger.info("Returning JSON..")
    return jsonify(d)


@routes.route("/api/enums", methods=["GET"])
@login_required
def get_enums():
    enums = {}
    app.logger.info("Retrieving all enums..")
    for name, obj in inspect.getmembers(models, inspect.isclass):
        if issubclass(obj, Enum) and name != "Enum":
            app.logger.debug("'%s' is an enum", name)
            enums[name] = [e.value for e in getattr(models, name)]
        else:
            app.logger.debug("'%s' is NOT an enum", name)
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
    app.logger.info("Returning JSON..")
    return jsonify(enums)


@routes.route("/api/_bulk", methods=["POST"])
@login_required
def bulk_update():
    app.logger.info("Starting bulk upload..")
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
    app.logger.info("Checking content type..")
    if request.content_type == "text/csv":
        app.logger.debug("Content type is csv, using pandas to read in.")
        try:
            app.logger.debug("Reading in csv and converted to a dictionary..")
            dat = pd.read_csv(StringIO(request.data.decode("utf-8")))
            dat = dat.where(pd.notnull(dat), None)
            dat = dat.to_dict(orient="records")
        except Exception as err:
            app.logger.error(
                "CSV failed to be read in. Please verify the file is a properly formatted csv."
            )
            abort(400, description=str(err))

    elif request.content_type == "application/json":
        app.logger.debug("Content type is JSON..")
        if not request.json:
            app.logger.error("Content type is JSON, but request body isn't JSON..")
            abort(415, description="Request body must be JSON")

        # the jsons must be in a list, even if it is a single json object
        if not isinstance(request.json, list):
            app.logger.error(
                "Content type is JSON and request body is JSON, but JSON isn't in an array.."
            )
            abort(422, description="JSON must be in an array")

        dat = request.json

    else:
        app.logger.error("Content type is not 'text/csv' or 'application/json'")
        abort(
            415,
            description="Only Content Type 'text/csv' or 'application/json' Supported",
        )

    try:
        app.logger.debug(
            "Assigning updated and created by IDs to user ID '%s'", current_user.user_id
        )
        updated_by_id = current_user.user_id
        created_by_id = current_user.user_id
    except:  # LOGIN_DISABLED
        app.logger.debug(
            "LOGIN_DISABLED = True so updated and created by IDs are defaulting to 1."
        )
        updated_by_id = 1
        created_by_id = 1

    if app.config.get("LOGIN_DISABLED") or current_user.is_admin:
        user_id = request.args.get("user", models.User.user_id)
        app.logger.debug("User is admin with ID '%s'", user_id)
    else:
        user_id = current_user.user_id
        app.logger.debug("User is regular with ID '%s'", user_id)

    # get user's group(s)
    app.logger.info("Retrieving supplied user groups..")
    requested_groups = request.args.get("groups")

    if requested_groups:
        requested_groups = requested_groups.split(",")
        app.logger.debug("User's groups are '%s'", requested_groups)
        groups = (
            models.Group.query.join(models.Group.users)
            .filter(
                models.User.user_id == user_id,
                models.Group.group_code.in_(requested_groups),
            )
            .all()
        )
        if len(requested_groups) != len(groups):
            app.logger.error(
                "User supplied groups and permission groups do not match up."
            )
            abort(404, description="Invalid group code provided")
    else:
        app.logger.debug("User did not provide groups, checking permissions..")
        groups = (
            models.Group.query.join(models.Group.users)
            .filter(models.User.user_id == user_id)
            .all()
        )
        app.logger.debug("User is part of '%s'", [x.group_name for x in groups])
        if len(groups) != 1:
            app.logger.error(
                "User belongs to multiple permission groups but no group was specified. User needs to specifiy group(s) they would like to add data in."
            )
            abort(
                400,
                description="User belongs to multiple permission groups but no group was specified",
            )
        if not groups:
            app.logger.error(
                "Verify user '%s'; '%s' was added to any permission groups",
                current_user.username,
                current_user.user_id,
            )
            abort(403, description="User does not belong to any permission groups")

    app.logger.info("Begin processing and inserting records into the database..")
    for i, row in enumerate(dat):
        app.logger.info("Start Record: %s", i)
        app.logger.debug("\tChecking sequencing date is provided")
        sequencing_date = row.get("sequencing_date")
        if not sequencing_date:
            app.logger.error("\tNo sequencing date provided.")
            abort(400, description="A sequencing date must be provided")
        else:
            app.logger.debug("\tSequencing date provided: '%s'", sequencing_date)

        # Find the family by codename or create it if it doesn't exist

        app.logger.debug(
            "\tChecking whether family already exists through codename '%s'..",
            row.get("family_codename"),
        )
        family_id = (
            db.session.query(models.Family.family_id)
            .filter(models.Family.family_codename == row.get("family_codename"))
            .scalar()
        )
        if not family_id:
            app.logger.debug(
                "\tFamily '%s' does not yet exist.., creating",
                row.get("family_codename"),
            )
            family = models.Family(
                family_codename=row.get("family_codename"),
                created_by_id=created_by_id,
                updated_by_id=updated_by_id,
            )
            db.session.add(family)
            app.logger.debug("\tInserting instance into database..")
            transaction_or_abort(db.session.flush)
            family_id = family.family_id
        else:
            app.logger.debug(
                "\tFamily ID '%s' already exists and won't be created.", family_id
            )

        # Fail if we have any invalid values
        app.logger.debug("\tValidating enums for participants..")
        enum_error = enum_validate(
            models.Participant, row, editable_dict["participant"]
        )
        if enum_error:
            app.logger.error("\tEnum invalid: " + enum_error)
            db.session.rollback()
            abort(400, description=f"Error on line {str(i + 1)} - " + enum_error)
        else:
            app.logger.debug("\tAll enums supplied are valid.")

        # get institution id
        app.logger.debug("\tRetrieving institution")
        institution = row.get("institution")
        if institution:
            app.logger.debug(
                "\tChecking supplied institution name, '%s', exists..", institution
            )
            institution_obj = models.Institution.query.filter(
                models.Institution.institution == institution
            ).one_or_none()
            if institution_obj:
                app.logger.debug("\tInstitution name exists, assigning its id")
                institution_id = institution_obj.institution_id
            else:
                app.logger.debug(
                    "\tInstitution name does not exist, creating a new entry in the database"
                )
                institution_obj = models.Institution(institution=institution)
                db.session.add(institution_obj)
                transaction_or_abort(db.session.commit)
                institution_id = institution_obj.institution_id
        else:
            app.logger.debug("\tNo institution supplied")

        # Find the participant by codename or create it if it doesn't exist
        app.logger.debug(
            "\tChecking participant exists through codename '%s'",
            row.get("participant_codename"),
        )
        participant_id = (
            db.session.query(models.Participant.participant_id)
            .filter(
                models.Participant.family_id == family_id,
                models.Participant.participant_codename
                == row.get("participant_codename"),
            )
            .scalar()
        )
        if not participant_id:
            app.logger.debug("\tParticipant does not exist, creating")
            participant = models.Participant(
                family_id=family_id,
                participant_codename=row.get("participant_codename"),
                sex=row.get("sex"),
                notes=row.get("notes"),
                affected=row.get("affected"),
                solved=row.get("solved"),
                participant_type=row.get("participant_type"),
                institution_id=institution_id if institution else None,
                month_of_birth=row.get("month_of_birth"),
                created_by_id=created_by_id,
                updated_by_id=updated_by_id,
            )
            app.logger.debug("\tCreating entry in the database..")
            db.session.add(participant)
            transaction_or_abort(db.session.flush)
            participant_id = participant.participant_id
        else:
            app.logger.debug(
                "\tParticipant already exists and will not be added to the database"
            )

        # Fail if we have any invalid values
        app.logger.debug("\tValidating enums for tissue samples..")
        enum_error = enum_validate(
            models.TissueSample, row, editable_dict["tissue_sample"]
        )
        if enum_error:
            db.session.rollback()
            abort(400, description=f"Error on line {str(i + 1)}: " + enum_error)
        else:
            app.logger.debug("\tAll enums supplied are valid.")

        # Create a new tissue sample under this participant
        app.logger.debug("\tCreating a new tissue sample..")
        tissue_sample = models.TissueSample(
            participant_id=participant_id,
            tissue_sample_type=row.get("tissue_sample_type"),
            notes=row.get("notes"),
            created_by_id=created_by_id,
            updated_by_id=updated_by_id,
        )
        app.logger.debug("\tCreating tissue sample entry in the database..")
        db.session.add(tissue_sample)
        transaction_or_abort(db.session.flush)
        app.logger.debug("\tDone")
        # Fail if we have any invalid values
        app.logger.debug("\tValidating enums for datasets..")
        enum_error = enum_validate(models.Dataset, row, editable_dict["dataset"])
        if enum_error:
            app.logger.error("\tEnum invalid: " + enum_error)
            db.session.rollback()
            abort(400, description=f"Error on line {str(i + 1)} - " + enum_error)
        else:
            app.logger.debug("\tAll enums supplied are valid.")

        # Create a new dataset under the new tissue sample
        app.logger.debug("\tCreating a new dataset..")
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
        app.logger.debug("\tLinking files to dataset..")
        if request.content_type == "text/csv":
            app.logger.debug(
                "\tContent type is `text/csv` and linked files are expected to be | separated: '%s'",
                row.get("linked_files", "").split("|"),
            )
            files = row.get("linked_files", "").split("|")
        else:
            app.logger.debug(
                "\tContent type is NOT `test/csv` and linked files are expected to be in a list: '%s'",
                row.get("linked_files", []),
            )
            files = row.get("linked_files", [])
        dataset.files += [models.DatasetFile(path=path) for path in files if path]

        app.logger.debug("\tAdding users groups to the dataset")
        dataset.groups += groups
        app.logger.debug("\tCreating dataset entry in the database..")
        db.session.add(dataset)
        transaction_or_abort(db.session.flush)
        app.logger.debug("\tDone")
        dataset_ids.append(dataset.dataset_id)

        app.logger.info("End Record: %s", i)

    transaction_or_abort(db.session.commit)
    app.logger.debug("%s datasets added", len(dataset_ids))

    app.logger.debug("Fetching all created datasets..")
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
            "institution": dataset.tissue_sample.participant.institution.institution
            if dataset.tissue_sample.participant.institution
            else None,
            "sex": dataset.tissue_sample.participant.sex,
            "family_codename": dataset.tissue_sample.participant.family.family_codename,
            "month_of_birth": dataset.tissue_sample.participant.month_of_birth,
        }
        for dataset in db_datasets
    ]
    app.logger.info("Done, returning JSON..")
    return jsonify(datasets)
