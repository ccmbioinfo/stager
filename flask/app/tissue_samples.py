from dataclasses import asdict

from flask import abort, jsonify, request, Response, Blueprint, current_app as app
from flask_login import login_user, logout_user, current_user, login_required
from .extensions import db, login
from . import models
from sqlalchemy.orm import contains_eager, joinedload
from .utils import check_admin, transaction_or_abort, mixin, enum_validate


tissue_blueprint = Blueprint(
    "tissue",
    __name__,
)


editable_columns = [
    "extraction_date",
    "tissue_sample_type",
    "tissue_processing",
    "notes",
]


@tissue_blueprint.route("/api/tissue_samples/<int:id>", methods=["GET"])
@login_required
def get_tissue_sample(id: int):

    app.logger.debug("Retrieving user id..")
    if app.config.get("LOGIN_DISABLED") or current_user.is_admin:
        user_id = request.args.get("user")
        app.logger.debug("User is admin with ID '%s'", user_id)
    else:
        user_id = current_user.user_id
        app.logger.debug("User is regular with ID '%s'", user_id)

    if user_id:
        app.logger.debug("Processing query - restricted based on user id.")
        tissue_sample = (
            models.TissueSample.query.filter_by(tissue_sample_id=id)
            .options(
                contains_eager(models.TissueSample.datasets),
                joinedload(models.TissueSample.created_by),
                joinedload(models.TissueSample.updated_by),
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
            .one_or_none()
        )
    else:
        app.logger.debug("Processing query - unrestricted based on user id.")
        tissue_sample = (
            models.TissueSample.query.filter_by(tissue_sample_id=id)
            .options(
                joinedload(models.TissueSample.datasets),
                joinedload(models.TissueSample.created_by),
                joinedload(models.TissueSample.updated_by),
            )
            .one_or_none()
        )

    if not tissue_sample:
        app.logger.error("No tissue samples found for tissue sample ID: '%s'", id)
        abort(404)

    app.logger.info("Query successful returning JSON..")
    return jsonify(
        {
            **asdict(tissue_sample),
            "created_by": tissue_sample.created_by.username,
            "updated_by": tissue_sample.updated_by.username,
            "datasets": [
                {
                    **asdict(dataset),
                }
                for dataset in tissue_sample.datasets
            ],
        }
    )


@tissue_blueprint.route("/api/tissue_samples/<int:id>", methods=["DELETE"])
@login_required
@check_admin
def delete_tissue_sample(id: int):

    app.logger.debug("DELETE request for tissue sample id '%s'", id)
    tissue_sample = (
        models.TissueSample.query.filter(models.TissueSample.tissue_sample_id == id)
        .options(
            joinedload(models.TissueSample.datasets),
        )
        .first_or_404()
    )

    if not tissue_sample.datasets:
        app.logger.debug("No datasets found, attempting to delete tissue sample..")
        try:
            db.session.delete(tissue_sample)
            db.session.commit()
            app.logger.debug("Tissue sample successfully deleted")
            return "Updated", 204
        except:
            app.logger.error(
                "Query failed even though datasets not found for the tissue sample"
            )
            db.session.rollback()
            abort(500)
    else:
        app.logger.error("Query failed as tissue sample has datasets.")
        abort(422, description="Tissue has dataset(s), cannot delete")


@tissue_blueprint.route("/api/tissue_samples", methods=["POST"])
@login_required
@check_admin
def create_tissue_sample():
    app.logger.debug("Checking request body")
    if not request.json:
        app.logger.error("Request body is not JSON")
        abort(415, description="Request body must be JSON")
    app.logger.debug("Request body is JSON")

    app.logger.debug("Checking tissue sample is supplied in body")
    tissue_sample_type = request.json.get("tissue_sample_type")
    if not tissue_sample_type:
        app.logger.error("No tissue sample type was provided in the request body")
        abort(400, description="A tissue sample type must be provided")
    app.logger.debug("Tissue sample is in request body and is '%s'", tissue_sample_type)

    app.logger.debug("Checking participant ID is supplied in body")
    participant_id = request.json.get("participant_id")
    if not participant_id:
        app.logger.error("No participant ID was provided in the request body")
        abort(400, description="A participant id must be provided")
    app.logger.debug("Participant ID is in request body and is '%s'", participant_id)

    app.logger.debug("Validating participant ID exists..")
    models.Participant.query.filter_by(participant_id=participant_id).first_or_404()
    app.logger.debug("Participant ID exists")
    app.logger.debug("Validating enums")
    enum_error = enum_validate(models.TissueSample, request.json, editable_columns)

    if enum_error:
        app.logger.error("Enum invalid: " + enum_error)
        abort(400, description=enum_error)
    else:
        app.logger.debug("All enums supplied are valid.")

    try:
        app.logger.debug(
            "Assigning updated and created by IDs to user ID '%s'", current_user.user_id
        )
        created_by_id = updated_by_id = current_user.user_id
    except:  # LOGIN DISABLED
        app.logger.debug(
            "LOGIN_DISABLED = True so updated and created by IDs are defaulting to 1."
        )
        created_by_id = updated_by_id = 1

    app.logger.debug("Creating instance of tissue sample..")
    tissue_sample = models.TissueSample(
        **{
            "participant_id": participant_id,
            "extraction_date": request.json.get("extraction_date"),
            "tissue_sample_type": tissue_sample_type,
            "tissue_processing": request.json.get("tissue_processing"),
            "notes": request.json.get("notes"),
            "created_by_id": created_by_id,
            "updated_by_id": updated_by_id,
        }
    )
    app.logger.debug("Finished creating instance of tissue sample..")

    try:
        app.logger.debug("Inserting instance into database..")
        db.session.add(tissue_sample)
        db.session.commit()

        ts_id = tissue_sample.tissue_sample_id
        location_header = "/api/tissue_samples/{}".format(ts_id)
        app.logger.debug("Entry successfully created, returning JSON")
        return (
            jsonify(
                {
                    **asdict(tissue_sample),
                    "created_by": tissue_sample.created_by.username,
                    "updated_by": tissue_sample.updated_by.username,
                }
            ),
            201,
            {"location": location_header},
        )
    except:
        db.session.rollback()
        app.logger.error("Instance failed to be inserted into the database.")
        abort(500)


@tissue_blueprint.route("/api/tissue_samples/<int:id>", methods=["PATCH"])
@login_required
def update_tissue_sample(id: int):
    app.logger.debug("Checking request body")
    if not request.json:
        app.logger.error("Request body is not JSON")
        abort(415, description="Request body must be JSON")
    app.logger.debug("Request body is JSON")

    app.logger.debug("Retrieving user id..")
    if app.config.get("LOGIN_DISABLED") or current_user.is_admin:
        user_id = request.args.get("user")
        app.logger.debug("User is admin with ID '%s'", user_id)
    else:
        user_id = current_user.user_id
        app.logger.debug("User is regular with ID '%s'", user_id)

    if user_id:
        app.logger.debug("Processing query - restricted based on user id.")
        tissue_sample = (
            models.TissueSample.query.filter_by(tissue_sample_id=id)
            .options(
                contains_eager(models.TissueSample.datasets),
                # contains_eager(models.TissueSample.created_by),
                # contains_eager(models.TissueSample.updated_by),
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
            .one_or_none()
        )
    else:
        app.logger.debug("Processing query - unrestricted based on user id.")
        tissue_sample = (
            models.TissueSample.query.filter_by(tissue_sample_id=id)
            .options(
                joinedload(models.TissueSample.datasets),
                joinedload(models.TissueSample.created_by),
                joinedload(models.TissueSample.updated_by),
            )
            .one_or_none()
        )

    if not tissue_sample:
        app.logger.error("No tissue samples found for tissue sample ID: '%s'", id)
        abort(404)

    app.logger.debug("Validating enums..")
    enum_error = mixin(tissue_sample, request.json, editable_columns)

    if enum_error:
        app.logger.error("Enum invalid: " + enum_error)
        abort(400, description=enum_error)
    else:
        app.logger.debug("All enums supplied are valid.")

    if user_id:
        app.logger.debug("Updating updated by ID to '%s'", user_id)
        tissue_sample.updated_by_id = user_id

    app.logger.debug("Commiting edit to tissue sample in the database..")
    transaction_or_abort(db.session.commit)
    app.logger.debug("Edit successful, returning json..")
    return jsonify(
        {
            **asdict(tissue_sample),
            "created_by": tissue_sample.created_by.username,
            "updated_by": tissue_sample.updated_by.username,
        }
    )
