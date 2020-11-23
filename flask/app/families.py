from dataclasses import asdict
import inspect

from flask import abort, jsonify, request, Response, current_app as app
from flask_login import login_user, logout_user, current_user, login_required
from app import db, login, models
from sqlalchemy.orm import joinedload, class_mapper
from .routes import check_admin, transaction_or_abort


@app.route("/api/families", methods=["GET"])
@login_required
def families_list():
    starts_with = request.args.get("starts_with", default="")
    starts_with = f"{starts_with}%"
    max_rows = request.args.get("max_rows", default=10000)
    try:
        int(max_rows)
    except:
        return "Max rows must be a valid  integer", 400

    order = request.args.get("order")
    if order:
        columns = models.Family.__table__.columns._data.keys()
        if order not in columns:
            return f"Column name must be one of {columns}", 400
        else:
            column = getattr(models.Family, order)
            db_families = (
                models.Family.query.options(joinedload(models.Family.participants))
                .filter(models.Family.family_codename.like(starts_with))
                .order_by(column)
                .limit(max_rows)
            )
    else:
        db_families = (
            models.Family.query.options(joinedload(models.Family.participants))
            .filter(models.Family.family_codename.like(starts_with))
            .limit(max_rows)
        )

    families = [
        {
            **asdict(family),
            "participants": family.participants,
        }
        for family in db_families
    ]

    return jsonify(families)


@app.route("/api/families/<int:id>", methods=["GET"])
@login_required
def families_by_id(id: int):
    family = (
        models.Family.query.filter_by(family_id=id)
        .options(
            joinedload(models.Family.participants)
            .joinedload(models.Participant.tissue_samples)
            .joinedload(models.TissueSample.datasets)
        )
        .first_or_404()
    )

    families = [
        {
            **asdict(family),
            "participants": [
                {
                    **asdict(participants),
                    "tissue_samples": [
                        {
                            **asdict(tissue_samples),
                            "datasets": tissue_samples.datasets,
                        }
                        for tissue_samples in participants.tissue_samples
                    ],
                }
                for participants in family.participants
            ],
        }
    ]
    return jsonify(families)


@app.route("/api/families/<int:id>", methods=["DELETE"])
@login_required
@check_admin
def delete_families(id: int):
    family = models.Family.query.filter_by(family_id=id).options(
        joinedload(models.Family.participants)
    )

    fam_entity = family.first_or_404()

    if len(fam_entity.participants) == 0:
        try:
            family.delete()
            db.session.commit()
            return "Deletion successful", 204
        except:
            db.session.rollback()
            return "Deletion of entity failed!", 422
    else:
        return "Family has participants, cannot delete!", 422


@app.route("/api/families/<int:id>", methods=["PATCH"])
@login_required
def edit_families(id: int):

    if not request.json:
        return "Request body must be JSON", 415

    try:
        fam_codename = request.json["family_codename"]
    except KeyError:
        return "No family codename provided", 400

    family = models.Family.query.get_or_404(id)

    family.family_codename = fam_codename

    try:
        family.updated_by = current_user.user_id
    except:
        pass  # LOGIN_DISABLED

    try:
        db.session.commit()
        return jsonify(family)
    except:
        db.session.rollback()
        return "Server error", 500


@app.route("/api/families", methods=["POST"])
@login_required
def create_family():
    if not request.json:
        return "Request body must be JSON", 400

    try:
        updated_by = current_user.user_id
        created_by = current_user.user_id
    except:  # LOGIN_DISABLED
        updated_by = 1
        created_by = 1

    fam_codename = request.json.get("family_codename")

    if not fam_codename:
        return "A family codename must be provided", 400

    if models.Family.query.filter(models.Family.family_codename == fam_codename).value(
        "family_id"
    ):
        return "Family Codename already in use", 422

    fam_objs = models.Family(
        family_codename=fam_codename,
        created_by=created_by,
        updated_by=updated_by,
    )

    db.session.add(fam_objs)
    transaction_or_abort(db.session.commit)

    location_header = "/api/families/{}".format(fam_objs.family_id)

    return jsonify(fam_objs), 201, {"location": location_header}
