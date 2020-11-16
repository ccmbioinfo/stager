from dataclasses import asdict

from flask import abort, jsonify, request, Response, current_app as app
from flask_login import login_user, logout_user, current_user, login_required
from app import db, login, models
from sqlalchemy.orm import contains_eager, joinedload
from .routes import check_admin


@app.route("/api/families", methods=["GET"])
@login_required
def families_list():
    if app.config.get("LOGIN_DISABLED") or current_user.is_admin:
        user_id = request.args.get("user")
    else:
        user_id = current_user.user_id

    if user_id:
        db_families = (
            models.Family.query.options(contains_eager(models.Family.participants))
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
            .all()
        )
    else:
        db_families = models.Family.query.options(
            joinedload(models.Family.participants)
        ).all()

    families = [
        {**asdict(family), "participants": family.participants}
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
