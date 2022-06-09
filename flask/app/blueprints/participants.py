from dataclasses import asdict

from flask import Blueprint, Response, abort, jsonify, request
from flask import current_app as app
from flask_login import current_user, login_required
from sqlalchemy import distinct, func, select
from sqlalchemy.orm import contains_eager, joinedload

from .. import models
from ..models import db
from ..schemas import ParticipantSchema
from ..utils import (
    check_admin,
    csv_response,
    expects_csv,
    expects_json,
    filter_datasets_by_user_groups,
    filter_in_enum_or_abort,
    filter_nullable_bool_or_abort,
    filter_updated_or_abort,
    get_current_user,
    paged,
    paginated_response,
    transaction_or_abort,
    str_to_bool,
    validate_enums_and_set_fields,
    validate_json,
    validate_filter_input,
)

editable_columns = [
    "participant_aliases",
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

participant_schema = ParticipantSchema()


@participants_blueprint.route(
    "/api/participants", methods=["GET"], strict_slashes=False
)
@login_required
@paged
def list_participants(page: int, limit: int) -> Response:

    order_by = request.args.get("order_by", type=str)
    allowed_columns = [
        "participant_id",
        "family_codename",
        "participant_codename",
        "notes",
        "participant_type",
        "sex",
        "affected",
        "solved",
        "updated",
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
        abort(400, description=f"order_by must be one of {allowed_columns}")

    order_dir = request.args.get("order_dir", type=str)

    if order_dir and order_dir not in ["desc", "asc"]:
        abort(400, description="order_dir must be either 'asc' or 'desc'")

    if order:
        if order_dir == "desc":
            order = order.desc()

    filters = []
    family_codename = request.args.get("family_codename", type=str)
    family_codename_exact_match = request.args.get(
        "family_codename_exact_match", type=str_to_bool, default=False
    )

    if family_codename:
        if family_codename_exact_match:
            filters.append(models.Family.family_codename == family_codename)
        else:
            filters.append(func.instr(models.Family.family_codename, family_codename))

    participant_codename = request.args.get("participant_codename", type=str)
    participant_codename_exact_match = request.args.get(
        "participant_codename_exact_match",
        type=str_to_bool,
        default=False,
    )
    if participant_codename:
        if participant_codename_exact_match:
            filters.append(
                models.Participant.participant_codename == participant_codename
            )
        else:
            filters.append(
                func.instr(
                    models.Participant.participant_codename, participant_codename
                )
            )

    notes = request.args.get("notes", type=str)
    if notes:
        filters.append(func.instr(models.Participant.notes, notes))
    participant_type = request.args.get("participant_type", type=str)
    if participant_type:
        filters.append(
            filter_in_enum_or_abort(
                models.Participant.participant_type,
                models.ParticipantType,
                participant_type,
            )
        )
    sex = request.args.get("sex", type=str)
    if sex:
        filters.append(filter_in_enum_or_abort(models.Participant.sex, models.Sex, sex))
    affected = request.args.get("affected", type=str)
    if affected:
        filters.append(
            filter_nullable_bool_or_abort(models.Participant.affected, affected)
        )
    solved = request.args.get("solved", type=str)
    if solved:
        filters.append(filter_nullable_bool_or_abort(models.Participant.solved, solved))
    updated = request.args.get("updated", type=str)
    if updated:
        filters.append(filter_updated_or_abort(models.Participant.updated, updated))

    user = get_current_user()

    if user.is_admin:
        query = (
            models.Participant.query.options(
                joinedload(models.Participant.institution),
                contains_eager(models.Participant.family),
                joinedload(models.Participant.tissue_samples)
                .joinedload(models.TissueSample.datasets)
                .joinedload(models.Dataset.linked_files),
            )
            .join(models.Participant.family)
            .filter(*filters)
        )
    else:
        query = (
            models.Participant.query.options(
                joinedload(models.Participant.institution),
                contains_eager(models.Participant.family),
                contains_eager(models.Participant.tissue_samples)
                .contains_eager(models.TissueSample.datasets)
                .contains_eager(models.Dataset.linked_files),
            )
            .join(models.Participant.family)
            .outerjoin(models.Participant.tissue_samples)
            .outerjoin(models.TissueSample.datasets)
            .outerjoin(models.Dataset.linked_files)
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
            .filter(models.users_groups_table.columns.user_id == user.user_id, *filters)
        )

    dataset_type = request.args.get("dataset_types", type=str)
    if dataset_type:
        subquery = (
            models.Participant.query.join(models.Participant.tissue_samples)
            .join(models.TissueSample.datasets)
            .filter(models.Dataset.dataset_type.in_(dataset_type.split(",")))
            .with_entities(models.Participant.participant_id)
            .subquery()
        )
        query = query.filter(
            models.Participant.participant_id.in_(select(subquery.c.participant_id))
        )

    # .count() returns the number of rows in the SQL response. When we join across a one-to-many
    # relationship, each parent row is multiplied by the number of children it has. This causes
    # .count() to disagree with len() as SQLAlchemy reroutes the duplicated rows back into their
    # mapped objects. In addition, .count() just wraps the main query in a subquery, so it can be
    # inefficient. Luckily, we can sidestep this whole problem efficiently by having the database
    # count the number of distinct parent primary keys returned. https://gist.github.com/hest/8798884
    total_count = query.with_entities(
        func.count(distinct(models.Participant.participant_id))
    ).scalar()
    participants = query.order_by(order).limit(limit).offset(page * (limit or 0)).all()
    results = [
        {
            **asdict(participant),
            "family_codename": participant.family.family_codename,
            "family_aliases": participant.family.family_aliases,
            "family_id": participant.family.family_id,
            "institution": participant.institution.institution
            if participant.institution
            else None,
            "updated_by": participant.updated_by.username,
            "created_by": participant.created_by.username,
            "tissue_samples": [
                {
                    **asdict(tissue_sample),
                    "datasets": [
                        {**asdict(d), "linked_files": d.linked_files}
                        for d in tissue_sample.datasets
                    ],
                }
                for tissue_sample in participant.tissue_samples
            ],
        }
        for participant in participants
    ]

    if expects_json(request):
        return paginated_response(results, page, total_count, limit)
    elif expects_csv(request):
        return csv_response(
            results,
            "participants_report.csv",
            [
                "participant_codename",
                "family_codename",
                "participant_type",
                "affected",
                "solved",
                "sex",
                "notes",
                "updated_by",
                "created_by",
            ],
        )

    abort(406, "Only 'text/csv' and 'application/json' HTTP accept headers supported")


@participants_blueprint.route("/api/participants/<int:id>", methods=["GET"])
@login_required
def get_participant(id: int):

    user = get_current_user()

    query = models.Participant.query.filter(
        models.Participant.participant_id == id
    ).options(
        joinedload(models.Participant.family),
        joinedload(models.Participant.institution),
    )

    if not user.is_admin:
        query = filter_datasets_by_user_groups(
            query.join(models.Participant.tissue_samples)
            .join(models.TissueSample.datasets)
            .options(
                contains_eager(models.Participant.tissue_samples).contains_eager(
                    models.TissueSample.datasets
                ),
            ),
            user,
        )

    participant = query.one_or_none()

    if not participant:
        abort(404)

    return jsonify(
        {
            **asdict(participant),
            "family_codename": participant.family.family_codename,
            "family_aliases": participant.family.family_aliases,
            "institution": participant.institution.institution
            if participant.institution
            else None,
            "updated_by": participant.updated_by.username,
            "created_by": participant.created_by.username,
            "tissue_samples": [
                {
                    **asdict(tissue_sample),
                    "created_by": tissue_sample.created_by.username,
                    "updated_by": tissue_sample.updated_by.username,
                    "datasets": [
                        {
                            **asdict(d),
                            "linked_files": d.linked_files,
                            "created_by": d.created_by.username,
                            "updated_by": d.updated_by.username,
                        }
                        for d in tissue_sample.datasets
                    ],
                }
                for tissue_sample in participant.tissue_samples
            ],
        }
    )


@participants_blueprint.route("/api/participants/<int:id>", methods=["DELETE"])
@login_required
@check_admin
def delete_participant(id: int):
    participant = (
        models.Participant.query.filter(models.Participant.participant_id == id)
        .options(joinedload(models.Participant.tissue_samples))
        .first_or_404()
    )
    if not participant.tissue_samples:
        try:
            db.session.delete(participant)
            db.session.commit()
            return "Updated", 204
        except:
            db.session.rollback()
            abort(500, description="Server error")
    else:
        abort(422, description="Participant has tissue samples, cannot delete")


@participants_blueprint.route("/api/participants/<int:id>", methods=["PATCH"])
@login_required
@validate_json
def update_participant(id: int):

    user = get_current_user()

    query = models.Participant.query.filter(models.Participant.participant_id == id)

    if not user.is_admin:
        query = filter_datasets_by_user_groups(
            query.join(models.Participant.tissue_samples).join(
                models.TissueSample.datasets
            ),
            user,
        )

    participant = query.first_or_404()

    validate_enums_and_set_fields(participant, request.json, editable_columns)

    if user:
        participant.updated_by_id = user.user_id

    transaction_or_abort(db.session.commit)

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


@participants_blueprint.route(
    "/api/participants", methods=["POST"], strict_slashes=False
)
@login_required
@check_admin
@validate_json
def create_participant():

    new_participant = validate_filter_input(request.json, models.Participant)
    result = participant_schema.validate(new_participant, session=db.session)

    if result:
        app.logger.error(result)
        abort(400, description=result)

    try:
        updated_by_id = current_user.user_id
        created_by_id = current_user.user_id
    except:  # LOGIN_DISABLED
        updated_by_id = 1
        created_by_id = 1

    # check if the participant exists under a given family

    family_id = request.json.get("family_id")
    participant_codename = request.json.get("participant_codename")

    ptp_query = models.Participant.query.filter(
        models.Participant.family_id == family_id,
        models.Participant.participant_codename == participant_codename,
    )

    if ptp_query.first() is not None:
        abort(422, description="Participant codename already exists under family")

    # check if family exists
    models.Family.query.filter(models.Family.family_id == family_id).first_or_404()

    # get institution id
    institution = request.json.get("institution")
    if institution:
        institution_obj = models.Institution.query.filter(
            models.Institution.institution == institution
        ).one_or_none()
        if institution_obj:
            institution_id = institution_obj.institution_id
        else:
            institution_obj = models.Institution(institution=institution)
            db.session.add(institution_obj)
            transaction_or_abort(db.session.flush)
            institution_id = institution_obj.institution_id

    ptp_objs = models.Participant(
        family_id=family_id,
        participant_codename=participant_codename,
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

    db.session.add(ptp_objs)
    transaction_or_abort(db.session.commit)

    location_header = "/api/participants/{}".format(ptp_objs.participant_id)

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
