from dataclasses import asdict

from flask import abort, jsonify, request, Blueprint, current_app as app
from flask_login import current_user, login_required
from .extensions import db
from . import models
from sqlalchemy.orm import contains_eager, joinedload
from .schemas import TissueSampleSchema
from .utils import (
    check_admin,
    filter_datasets_by_user_groups,
    get_current_user,
    transaction_or_abort,
    validate_enums_and_set_fields,
    validate_json,
    validate_filter_input,
)


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

tissue_sample_schema = TissueSampleSchema()


@tissue_blueprint.route("/api/tissue_samples/<int:id>", methods=["GET"])
@login_required
def get_tissue_sample(id: int):

    user = get_current_user()

    if user.is_admin:
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
    else:
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
            .filter(models.users_groups_table.columns.user_id == user.user_id)
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


@tissue_blueprint.route("/api/tissue_samples", methods=["POST"], strict_slashes=False)
@login_required
@check_admin
@validate_json
def create_tissue_sample():

    new_tissue_sample = validate_filter_input(request.json, models.TissueSample)

    result = tissue_sample_schema.validate(new_tissue_sample, session=db.session)

    if result:
        app.logger.error(jsonify(result))
        abort(400, description=result)

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
            "participant_id": request.json.get("participant_id"),
            "extraction_date": request.json.get("extraction_date"),
            "tissue_sample_type": request.json.get("tissue_sample_type"),
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
@validate_json
def update_tissue_sample(id: int):

    user = get_current_user()

    query = models.TissueSample.query.filter_by(tissue_sample_id=id)

    if not user.is_admin:
        query = filter_datasets_by_user_groups(
            query.join(models.TissueSample.datasets), user
        )

    tissue_sample = query.first_or_404()

    app.logger.debug("Validating enums..")

    validate_enums_and_set_fields(tissue_sample, request.json, editable_columns)

    app.logger.debug("All enums supplied are valid.")

    if user:
        app.logger.debug("Updating updated by ID to '%s'", user.user_id)
        tissue_sample.updated_by_id = user.user_id

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
