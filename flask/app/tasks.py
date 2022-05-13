import json
import os
from datetime import datetime, timedelta

from sqlalchemy.orm import joinedload

from . import models
from .email import send_email


def send_email_notification(app):
    with app.app_context():
        yesterday = (datetime.now() - timedelta(1)).strftime("%Y-%m-%d")
        analyses = (
            models.Analysis.query.options(
                joinedload(models.Analysis.datasets).joinedload(
                    models.Dataset.linked_files
                ),
                joinedload(models.Analysis.requester),
                joinedload(models.Analysis.datasets)
                .joinedload(models.Dataset.tissue_sample)
                .joinedload(models.TissueSample.participant)
                .joinedload(models.Participant.family),
            )
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
                    "priority": analysis.priority.value,
                    "datasets": [
                        {
                            "dataset_id": dataset.dataset_id,
                            "notes": dataset.notes or "",
                            "linked_files": ", ".join(
                                [file.path for file in dataset.linked_files]
                            ),
                            "participant_codename": dataset.tissue_sample.participant.participant_codename,
                            "participant_aliases": dataset.tissue_sample.participant.participant_aliases
                            or "",
                            "family_codename": dataset.tissue_sample.participant.family.family_codename,
                            "participant_notes": dataset.tissue_sample.participant.notes
                            or "",
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
            f"{len(email_analyses)} analysis requests found... {json.dumps(email_analyses)}"
        )
