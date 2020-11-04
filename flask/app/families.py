from dataclasses import asdict

from flask import abort, jsonify, request, Response, current_app as app
from flask_login import login_user, logout_user, current_user, login_required
from app import db, login, models
from sqlalchemy.orm import joinedload
from .routes import check_admin



@app.route("/api/families", methods=["GET"])
@login_required
def families_list():

    db_families = models.Family.query.options(
        joinedload(models.Family.participants)
    ).all()

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
    family = models.Family.query.filter_by(family_id = id).options(
        joinedload(models.Family.participants)\
            .joinedload(models.Participant.tissue_samples)\
                .joinedload(models.TissueSample.datasets)
    ).first_or_404()


    families = [
        { 
            **asdict(family),
            "participants": [
            {
                **asdict(participants),
                "tissue_samples": [
                        {
                            **asdict(tissue_samples),
                            "datasets": [
                                {
                                    **asdict(dataset)
                                }
                            
                                for dataset in tissue_samples.datasets
                            ]
                        }
                        for tissue_samples in participants.tissue_samples
                    ]
                }
            for participants in family.participants
            ]
        }
    ]
    return jsonify(families)


@app.route("/api/families/<int:id>", methods = ["DELETE"])
@login_required
@check_admin
def delete_families(id: int):
    family = models.Family.query.filter_by(family_id = id).options(
        joinedload(models.Family.participants)
    )

    fam_entity = family.first_or_404()

    if len(fam_entity.participants) == 0:
        try:
            family.delete()
            db.session.commit()
            return 'Deletion successful', 200
        except:
            db.session.rollback()
            return 'Deletion of entity failed!', 422
    else:
        return 'Family has participants, cannot delete!', 422

