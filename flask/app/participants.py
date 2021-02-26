from dataclasses import asdict

from flask_login import current_user, login_required
from sqlalchemy import distinct, func
from sqlalchemy.orm import contains_eager, joinedload

from flask import Blueprint, Response, abort
from flask import current_app as app
from flask import jsonify, request

from . import models
from .extensions import db
from .utils import (
    check_admin,
    enum_validate,
    filter_in_enum_or_abort,
    filter_nullable_bool_or_abort,
    mixin,
    transaction_or_abort,
)

editable_columns = [
    "participant_codename",
    "sex",
    "participant_type",
    "affected",
    "month_of_birth",
    "solved",
    "notes",
]


participants_blueprint = Blueprint(
    "participants",
    __name__,
)


@participants_blueprint.route("/api/participants", methods=["GET"])
@login_required
def list_participants() -> Response:

    app.logger.debug("Parsing paged query parameters")
    # General paged query parameters
    # for some reason type=int doesn't catch non-integer queries, only returning None
    app.logger.debug("Validating page")
    try:
        page = int(request.args.get("page", default=0))
        if page < 0:  # zero-indexed pages
            raise ValueError
    except:
        app.logger.error("page must be a non-negative integer")
        abort(400, description="page must be a non-negative integer")
    app.logger.debug("Validating limit...")
    try:
        limit = request.args.get("limit")
        if limit is not None:  # unspecified limit means return everything
            limit = int(limit)
            if limit <= 0:  # MySQL accepts 0 but that's just a waste of time
                raise ValueError
    except:
        app.logger.error("limit must be a positive integer")
        abort(400, description="limit must be a positive integer")

    app.logger.debug("Parsing order query parameters")
    order_by = request.args.get("order_by", type=str)
    app.logger.debug("Validating order_by: '%s'", order_by)
    allowed_columns = [
        "family_codename",
        "participant_codename",
        "notes",
        "participant_type",
        "sex",
        "affected",
        "solved",
    ]
    if order_by is None:
        order = None  # system default, likely participant_id
    elif order_by == "family_codename":
        order = models.Family.family_codename
    elif order_by in allowed_columns:
        # Since this is an elif clause, we know family_codename is already handled above.
        # order_by has been restricted to a known list, so we can safely use getattr
        order = getattr(models.Participant, order_by)
    else:
        app.logger.error("order_by must be one of '%s'", allowed_columns)
        abort(400, description=f"order_by must be one of {allowed_columns}")

    if order:
        order_dir = request.args.get("order_dir", type=str)
        app.logger.debug("Validating order_dir: '%s'", order_dir)
        if order_dir == "desc":
            order = order.desc()
        elif order_dir == "asc":
            order = order.asc()
        else:
            app.logger.error("order_dir must be one either 'asc', 'desc'")
            abort(400, description="order_dir must be either 'asc' or 'desc'")

    app.logger.debug("Parsing filter query parameters")
    filters = []
    family_codename = request.args.get("family_codename", type=str)
    app.logger.debug("Parsing family_codename: '%s'", family_codename)
    if family_codename:
        filters.append(func.instr(models.Family.family_codename, family_codename))
    participant_codename = request.args.get("participant_codename", type=str)
    app.logger.debug("Parsing participant_codename: '%s'", participant_codename)
    if participant_codename:
        filters.append(
            func.instr(models.Participant.participant_codename, participant_codename)
        )
    notes = request.args.get("notes", type=str)
    app.logger.debug("Parsing notes: '%s'", notes)
    if notes:
        filters.append(func.instr(models.Participant.notes, notes))
    participant_type = request.args.get("participant_type", type=str)
    app.logger.debug("Parsing participant_type: '%s'", participant_type)
    if participant_type:
        filters.append(
            filter_in_enum_or_abort(
                models.Participant.participant_type,
                models.ParticipantType,
                participant_type,
            )
        )
    sex = request.args.get("sex", type=str)
    app.logger.debug("Parsing sex: '%s'", sex)
    if sex:
        filters.append(filter_in_enum_or_abort(models.Participant.sex, models.Sex, sex))
    affected = request.args.get("affected", type=str)
    app.logger.debug("Parsing affected: '%s'", affected)
    if affected:
        filters.append(
            filter_nullable_bool_or_abort(models.Participant.affected, affected)
        )
    solved = request.args.get("solved", type=str)
    app.logger.debug("Parsing solved: '%s'", solved)
    if solved:
        filters.append(filter_nullable_bool_or_abort(models.Participant.solved, solved))

    app.logger.debug("Retrieving user id")
    if app.config.get("LOGIN_DISABLED") or current_user.is_admin:
        user_id = request.args.get("user")
        app.logger.debug("User is admin with ID '%s'", user_id)
    else:
        user_id = current_user.user_id
        app.logger.debug("User is regular with ID '%s'", user_id)

    if user_id:  # Regular user or assumed identity, return only permitted participants
        app.logger.debug("Processing query - restricted based on user id '%s'.", user_id)
        query = (
            models.Participant.query.options(
                joinedload(models.Participant.institution),
                contains_eager(models.Participant.family),
                contains_eager(models.Participant.tissue_samples).contains_eager(
                    models.TissueSample.datasets
                ),
            )
            .join(models.Participant.family)
            .outerjoin(models.Participant.tissue_samples)
            .outerjoin(models.TissueSample.datasets)
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
            .filter(models.users_groups_table.columns.user_id == user_id, *filters)
        )
    else:  # Admin or LOGIN_DISABLED, authorized to query all participants
        app.logger.debug("Processing query - unrestricted based on user id")
        query = (
            models.Participant.query.options(
                joinedload(models.Participant.institution),
                contains_eager(models.Participant.family),
                joinedload(models.Participant.tissue_samples).joinedload(
                    models.TissueSample.datasets
                ),
            )
            .join(models.Participant.family)
            .filter(*filters)
        )
    # .count() returns the number of rows in the SQL response. When we join across a one-to-many
    # relationship, each parent row is multiplied by the number of children it has. This causes
    # .count() to disagree with len() as SQLAlchemy reroutes the duplicated rows back into their
    # mapped objects. In addition, .count() just wraps the main query in a subquery, so it can be
    # inefficient. Luckily, we can sidestep this whole problem efficiently by having the database
    # count the number of distinct parent primary keys returned. https://gist.github.com/hest/8798884
    app.logger.debug("Counting number of participants")
    total_count = query.with_entities(
        func.count(distinct(models.Participant.participant_id))
    ).scalar()
    participants = query.order_by(order).limit(limit).offset(page * (limit or 0)).all()

    app.logger.debug("Query successful, returning JSON")
    return jsonify(
        {
            "data": [
                {
                    **asdict(participant),
                    "family_codename": participant.family.family_codename,
                    "institution": participant.institution.institution
                    if participant.institution
                    else None,
                    "updated_by": participant.updated_by.username,
                    "created_by": participant.created_by.username,
                    "tissue_samples": [
                        {**asdict(tissue_sample), "datasets": tissue_sample.datasets}
                        for tissue_sample in participant.tissue_samples
                    ],
                }
                for participant in participants
            ],
            "page": page if limit else 0,
            "total_count": total_count,
        }
    )


@participants_blueprint.route("/api/participants/<int:id>", methods=["DELETE"])
@login_required
@check_admin
def delete_participant(id: int):
    app.logger.debug("DELETE request for participant id '%s'", id)
    participant = (
        models.Participant.query.filter(models.Participant.participant_id == id)
        .options(joinedload(models.Participant.tissue_samples))
        .first_or_404()
    )
    if not participant.tissue_samples:
        try:
            db.session.delete(participant)
            db.session.commit()
            app.logger.debug("DELETE request for participant id '%s' succeeded", id)
            return "Updated", 204
        except:
            db.session.rollback()
            app.logger.error("Server error")
            abort(500, description="Server error")
    else:
        app.logger.error("Query failed as participant has associated tissue samples")
        abort(422, description="Participant has tissue samples, cannot delete")


@participants_blueprint.route("/api/participants/<int:id>", methods=["PATCH"])
@login_required
def update_participant(id: int):

    app.logger.debug("Checking request body")
    if not request.json:
        app.logger.error("Request body is not JSON")
        abort(415, description="Request body must be JSON")
    app.logger.debug("Request body is JSON")

    app.logger.debug("Retrieving user id")
    if app.config.get("LOGIN_DISABLED") or current_user.is_admin:
        user_id = request.args.get("user")
        app.logger.debug("User is admin with ID '%s'", user_id)
    else:
        user_id = current_user.user_id
        app.logger.debug("User is regular with ID '%s'", user_id)

    if user_id:
        app.logger.debug("Processing query - restricted based on user id")
        participant = (
            models.Participant.query.filter(models.Participant.participant_id == id)
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
        app.logger.debug("Processing query - unrestricted based on user id")
        participant = models.Participant.query.filter(
            models.Participant.participant_id == id
        ).first_or_404()

    enum_error = mixin(participant, request.json, editable_columns)

    if enum_error:
        app.logger.error("%s", enum_error)
        abort(400, description="enum_error")

    app.logger.debug("Participant update is peformed by user: '%s'", user_id)
    if user_id:
        participant.updated_by_id = user_id

    transaction_or_abort(db.session.commit)

    app.logger.debug("Update successful, returning JSON")
    return jsonify(
        [
            {
                **asdict(participant),
                "institution": participant.institution.institution
                if participant.institution
                else None,
                "created_by": participant.created_by.username,
                "updated_by": participant.updated_by.username,
            }
        ]
    )


@participants_blueprint.route("/api/participants", methods=["POST"])
@login_required
@check_admin
def create_participant():
    app.logger.debug("Checking request body")
    if not request.json:
        app.logger.error("Request body is not JSON")
        abort(415, description="Request body must be JSON")
    app.logger.debug("Request body is JSON")
    try:
        app.logger.debug(
            "Assigning updated and created by IDs to user ID '%s'", current_user.user_id
        )
        updated_by_id = current_user.user_id
        created_by_id = current_user.user_id
    except:  # LOGIN_DISABLED
        app.logger.debug(
            "LOGIN_DISABLED = True so updated and created by IDs are defaulting to 1"
        )
        updated_by_id = 1
        created_by_id = 1

    # check if the participant exists under a given family
    app.logger.debug(
        "Checking if participant '%s' already exists under family",
        request.json.get("participant_codename"),
    )
    ptp_query = models.Participant.query.filter(
        models.Participant.family_id == request.json.get("family_id"),
        models.Participant.participant_codename
        == request.json.get("participant_codename"),
    )

    if ptp_query.first() is not None:
        app.logger.error(
            "Participant codename '%s' already exists under family",
            request.json.get("participant_codename"),
        )
        abort(422, description="Participant codename already exists under family")

    # check if family exists
    app.logger.debug("Checking if family '%s' exists", request.json.get("family_id"))
    models.Family.query.filter(
        models.Family.family_id == request.json.get("family_id")
    ).first_or_404()

    # validate enums
    enum_error = enum_validate(models.Participant, request.json, editable_columns)

    if enum_error:
        app.logger.error("%s", enum_error)
        abort(400, description=enum_error)

    # get institution id
    app.logger.debug("Check if institution '%s' exists", request.json.get("institution"))
    institution = request.json.get("institution")
    if institution:
        institution_obj = models.Institution.query.filter(
            models.Institution.institution == institution
        ).one_or_none()
        if institution_obj:
            app.logger.debug("Institution exists, getting id")
            institution_id = institution_obj.institution_id
        else:
            app.logger.debug("Create new institution")
            institution_obj = models.Institution(institution=institution)
            db.session.add(institution_obj)
            transaction_or_abort(db.session.flush)
            institution_id = institution_obj.institution_id

    app.logger.debug("Creating an instance of the participant model")
    ptp_objs = models.Participant(
        family_id=request.json.get("family_id"),
        participant_codename=request.json.get("participant_codename"),
        sex=request.json.get("sex"),
        notes=request.json.get("notes"),
        affected=request.json.get("affected"),
        solved=request.json.get("solved"),
        participant_type=request.json.get("participant_type"),
        institution_id=institution_id if institution else None,
        month_of_birth=request.json.get("month_of_birth"),
        created_by_id=created_by_id,
        updated_by_id=updated_by_id,
    )

    app.logger.debug("Adding the participant instance to the database")
    db.session.add(ptp_objs)
    transaction_or_abort(db.session.commit)

    location_header = "/api/participants/{}".format(ptp_objs.participant_id)

    app.logger.debug("Participant successfully added to the database. Returning JSON")
    return (
        jsonify(
            {
                **asdict(ptp_objs),
                "institution": ptp_objs.institution.institution
                if ptp_objs.institution
                else None,
                "created_by": ptp_objs.created_by.username,
                "updated_by": ptp_objs.updated_by.username,
            }
        ),
        201,
        {"location": location_header},
    )
