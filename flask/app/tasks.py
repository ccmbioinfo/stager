import os
from datetime import datetime, timedelta
from sqlalchemy.orm import joinedload
from . import models
from .email import send_email


def send_email_notification(app):
    with app.app_context():
        yesterday = (datetime.now() - timedelta(1)).strftime("%Y-%m-%d")

        analyses = (
            models.Analysis.query.options(joinedload(models.Analysis.datasets))
            .filter(models.Analysis.requested >= yesterday)
            .all()
        )

        email_analyses = []

        for analysis in analyses:
            email_analyses.append(
                {
                    "analysis_id": analysis.analysis_id,
                    "requested": analysis.requested.strftime("%Y-%m-%d"),
                    "requester": analysis.requester.username,
                    "pipeline": analysis.kind,
                    "priority": analysis.priority,
                    "datasets": [
                        {
                            "dataset_id": dataset.dataset_id,
                            "notes": dataset.notes,
                            "linked_files": ", ".join(
                                [file.path for file in dataset.linked_files]
                            ),
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
                        for dataset in analysis.datasets
                    ],
                }
            )

        if len(email_analyses) > 0:
            send_email(
                to_emails=os.getenv("SENDGRID_TO_EMAIL"),
                from_email=os.getenv("SENDGRID_FROM_EMAIL"),
                dynamic_template_object={"analyses": email_analyses},
            )

        app.logger.debug(
            f"{len(email_analyses)} analysis requests found...", email_analyses
        )
