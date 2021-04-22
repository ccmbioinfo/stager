from dataclasses import asdict

from flask import abort, jsonify, request, Response, Blueprint, current_app as app
from flask_login import login_user, logout_user, current_user, login_required
from .extensions import db, login
from . import models
from sqlalchemy.orm import contains_eager, joinedload
from .utils import check_admin, validate_json, transaction_or_abort

family_blueprint = Blueprint(
    "families",
    __name__,
)


@family_blueprint.route("/api/families", methods=["GET"], strict_slashes=False)
@login_required
def list_families():

    app.logger.debug("Parsing query parameters..")

    starts_with = request.args.get("starts_with", default="", type=str)
    starts_with = f"{starts_with}%"
    max_rows = request.args.get("max_rows", default=100)
    order_by_col = request.args.get("order", default="family_id", type=str)

    app.logger.debug(
        "Query parameters: \n\tstarts_with %s \n\tmax_rows %s, \n\torder_by_col %s",
        starts_with,
        max_rows,
        order_by_col,
    )

    app.logger.debug("Validating max rows..")
    try:
        int(max_rows)
    except:
        app.logger.error("Max Rows: %s is not a valid integer")
        abort(400, description="Max rows must be a valid integer")

    columns = models.Family.__table__.columns.keys()

    app.logger.debug("Validating 'order_by' column..")
    if order_by_col not in columns:
        app.logger.error(
            "Column name %s is not valid, it must be one of %s", order_by_col, columns
        )
        abort(400, description=f"Column name for ordering must be one of {columns}")
    column = getattr(models.Family, order_by_col)

    app.logger.debug("Query parameters successfully parsed.")

    app.logger.debug("Retrieving user id..")
    if app.config.get("LOGIN_DISABLED") or current_user.is_admin:
        user_id = request.args.get("user")
        app.logger.debug("User is admin with ID '%s'", user_id)
    else:
        user_id = current_user.user_id
        app.logger.debug("User is regular with ID '%s'", user_id)
    if user_id:
        app.logger.debug("Processing query - restricted based on user id.")
        families = (
            models.Family.query.options(contains_eager(models.Family.participants))
            .filter(models.Family.family_codename.like(starts_with))
            .join(models.Participant)
            .join(models.TissueSample)
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
            .order_by(column)
            .limit(max_rows)
        )
    else:
        app.logger.debug("Processing query - unrestricted based on user id.")
        families = (
            models.Family.query.options(
                joinedload(models.Family.participants),
                joinedload(models.Family.created_by),
                joinedload(models.Family.updated_by),
            )
            .filter(models.Family.family_codename.like(starts_with))
            .order_by(column)
            .limit(max_rows)
        )
    app.logger.debug("Query successful, returning JSON...")
    return jsonify(
        [
            {
                **asdict(family),
                "participants": [
                    {
                        **asdict(participant),
                        "institution": participant.institution.institution
                        if participant.institution
                        else None,
                    }
                    for participant in family.participants
                ],
                "updated_by": family.updated_by.username,
                "created_by": family.created_by.username,
            }
            for family in families
        ]
    )


@family_blueprint.route("/api/families/<int:id>", methods=["GET"])
@login_required
def get_family(id: int):
    app.logger.debug("Retrieving user id..")
    if app.config.get("LOGIN_DISABLED") or current_user.is_admin:
        user_id = request.args.get("user")
        app.logger.debug("User is admin with ID '%s'", user_id)
    else:
        user_id = current_user.user_id
        app.logger.debug("User is regular with ID '%s'", user_id)

    if user_id:
        app.logger.debug("Processing query - restricted based on user id.")
        family = (
            models.Family.query.filter_by(family_id=id)
            .options(
                contains_eager(models.Family.participants)
                .contains_eager(models.Participant.tissue_samples)
                .contains_eager(models.TissueSample.datasets)
            )
            .join(models.Participant)
            .join(models.TissueSample)
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
        family = (
            models.Family.query.filter_by(family_id=id)
            .options(
                joinedload(models.Family.participants)
                .joinedload(models.Participant.tissue_samples)
                .joinedload(models.TissueSample.datasets),
                joinedload(models.Family.created_by),
                joinedload(models.Family.updated_by),
            )
            .one_or_none()
        )

    if not family:
        app.logger.debug("Query did not return any records.")
        abort(404)

    app.logger.debug("Query successful, returning JSON...")
    return jsonify(
        [
            {
                **asdict(family),
                "updated_by": family.updated_by.username,
                "created_by": family.created_by.username,
                "participants": [
                    {
                        **asdict(participant),
                        "institution": participant.institution.institution
                        if participant.institution
                        else None,
                        "updated_by": participant.updated_by.username,
                        "created_by": participant.created_by.username,
                        "tissue_samples": [
                            {
                                **asdict(tissue_sample),
                                "datasets": tissue_sample.datasets,
                                "updated_by": tissue_sample.updated_by.username,
                                "created_by": tissue_sample.created_by.username,
                            }
                            for tissue_sample in participant.tissue_samples
                        ],
                    }
                    for participant in family.participants
                ],
            }
        ]
    )


@family_blueprint.route("/api/families/<int:id>", methods=["DELETE"])
@login_required
@check_admin
def delete_family(id: int):
    app.logger.debug("DELETE request for family id '%s'", id)
    family = models.Family.query.filter_by(family_id=id).options(
        joinedload(models.Family.participants)
    )

    fam_entity = family.first_or_404()

    if len(fam_entity.participants) == 0:
        app.logger.debug("Family has no participants")
        try:
            family.delete()
            db.session.commit()
            app.logger.debug("DELETE request for family id '%s' succeeded", id)
            return "Deletion successful", 204
        except:
            db.session.rollback()
            app.logger.error(
                "Query failed"
            )  # when would this fail if participants is accounted for?
            abort(422, description="Deletion of entity failed!")
    else:
        app.logger.error("Query failed as family has participants.")
        abort(422, description="Family has participants, cannot delete!")


@family_blueprint.route("/api/families/<int:id>", methods=["PATCH"])
@login_required
@validate_json
def update_family(id: int):

    app.logger.debug("Checking family codename is supplied in body")
    try:
        fam_codename = request.json["family_codename"]
    except KeyError:
        app.logger.error("No family codename was provided in the request body")
        abort(400, description="No family codename provided")
    app.logger.debug("Family codename is in request body and is '%s'", fam_codename)

    app.logger.debug("Retrieving user id..")
    if app.config.get("LOGIN_DISABLED") or current_user.is_admin:
        user_id = request.args.get("user")
        app.logger.debug("User is admin with ID '%s'", user_id)
    else:
        user_id = current_user.user_id
        app.logger.debug("User is regular with ID '%s'", user_id)

    if user_id:
        app.logger.debug("Processing query - restricted based on user id.")
        family = (
            models.Family.query.filter_by(family_id=id)
            .join(models.Participant)
            .join(models.TissueSample)
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
        app.logger.debug("Processing query - unrestricted based on user id.")
        family = models.Family.query.filter_by(family_id=id).first_or_404()

    app.logger.debug(
        "Family codename is being changed from '%s' to '%s'",
        family.family_codename,
        fam_codename,
    )
    family.family_codename = fam_codename

    app.logger.debug("Family code update is peformed by user: '%s'", user_id)
    if user_id:
        family.updated_by_id = user_id

    try:

        db.session.commit()
        app.logger.debug("Update successful, returning JSON...")
        return jsonify(
            {
                **asdict(family),
                "updated_by": family.updated_by.username,
                "created_by": family.created_by.username,
            }
        )
    except:
        app.logger.error("Update unsuccessful")  # under what cases would this fail
        db.session.rollback()
        abort(500)


@family_blueprint.route("/api/families", methods=["POST"], strict_slashes=False)
@login_required
@check_admin
@validate_json
def create_family():

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

    app.logger.debug("Checking family codename is supplied in body")
    try:
        fam_codename = request.json["family_codename"]
    except KeyError:
        app.logger.error("No family codename was provided in the request body")
        abort(400, description="No family codename provided")
    app.logger.debug("Family codename is in request body and is '%s'", fam_codename)

    app.logger.debug(
        "Checking the requested family codenam, '%s', is not already in use.",
        fam_codename,
    )

    family_exists_id = models.Family.query.filter(
        models.Family.family_codename == fam_codename
    ).value("family_id")

    if family_exists_id:
        app.logger.error(
            "Requested codename already exists for family ID '%s' and cannot be created.",
            family_exists_id,
        )
        abort(422, description="Family Codename already in use")
    app.logger.debug(
        "The requested family codename '%s' is not already in use.", fam_codename
    )

    app.logger.debug("Creating an instance of the family model")
    fam_objs = models.Family(
        family_codename=fam_codename,
        created_by_id=created_by_id,
        updated_by_id=updated_by_id,
    )

    app.logger.debug("Adding the family instance to the database")
    db.session.add(fam_objs)
    transaction_or_abort(db.session.commit)

    location_header = "/api/families/{}".format(fam_objs.family_id)

    app.logger.debug("Family successfully added to the database. Returning json..")
    return (
        jsonify(
            {
                **asdict(fam_objs),
                "updated_by": fam_objs.updated_by.username,
                "created_by": fam_objs.created_by.username,
            }
        ),
        201,
        {"location": location_header},
    )
