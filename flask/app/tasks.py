import os
from datetime import datetime, timedelta
from . import models
from .email import send_email
from .extensions import db
from dataclasses import asdict


def send_email_notification(app):
    with app.app_context():

        app.logger.info("Sending email notification...")

        yesterday = (datetime.now() - timedelta(1)).strftime("%Y-%m-%d")
        today = datetime.now().strftime("%Y-%m-%d")

        analyses = db.session.query(models.Analysis).filter(
            models.Analysis.requested >= yesterday,
            models.Analysis.requested < today,
        )

        app.logger.debug(analyses)

        dynamic_object = {"analyses": []}

        for analysis in analyses:
            mapped_dataset_ids_gen = (
                db.session.query(models.datasets_analyses_table)
                .filter(
                    models.datasets_analyses_table.c.analysis_id == analysis.analysis_id
                )
                .values("dataset_id")
            )

            mapped_dataset_ids = [x for x, in mapped_dataset_ids_gen]

            datasets = (
                db.session.query(models.Dataset)
                .filter(models.Dataset.dataset_id.in_(mapped_dataset_ids))
                .all()
            )

        dynamic_object["analyses"].append(
            {
                **asdict(analysis),
                "requested": analysis.requested.strftime("%Y-%m-%d"),
                "requester": analysis.requester.username,
                "priority": analysis.priority,
                "datasets": [
                    {
                        "dataset_id": dataset.dataset_id,
                        "notes": dataset.notes,
                        "linked_files": ", ".join(dataset.linked_files),
                        "group_code": ", ".join(
                            [group.group_code for group in dataset.groups]
                        ),
                        "tissue_sample_type": dataset.tissue_sample.tissue_sample_type,
                        "participant_codename": dataset.tissue_sample.participant.participant_codename,
                        "participant_type": dataset.tissue_sample.participant.participant_type,
                        "participant_aliases": dataset.tissue_sample.participant.participant_aliases,
                        "family_aliases": dataset.tissue_sample.participant.family.family_aliases,
                        "institution": dataset.tissue_sample.participant.institution.institution
                        if dataset.tissue_sample.participant.institution
                        else None,
                        "sex": dataset.tissue_sample.participant.sex,
                        "family_codename": dataset.tissue_sample.participant.family.family_codename,
                        "updated_by": dataset.tissue_sample.updated_by.username,
                        "created_by": dataset.tissue_sample.created_by.username,
                        "participant_notes": dataset.tissue_sample.participant.notes,
                    }
                    for dataset in datasets
                ],
            }
        )

        app.logger.debug("Dynamic object template...")
        app.logger.debug(dynamic_object)

        if os.getenv("SENDGRID_API_KEY"):
            send_email(
                to_emails=os.getenv("SENDGRID_TO_EMAIL"),
                from_email=os.getenv("SENDGRID_FROM_EMAIL"),
                dynamic_template_object=dynamic_object,
            )
