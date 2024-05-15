import json
import math
from datetime import datetime, timedelta
from typing import Any, Dict

from flask import Flask
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import From, Mail, SendAt, To
from sqlalchemy.orm import joinedload

from . import models


class Mailer:
    def __init__(self, app: Flask):
        self.app = app
        # https://github.com/sendgrid/sendgrid-python
        self.sg = SendGridAPIClient(app.config["SENDGRID_API_KEY"])

    def send(
        self, from_email: str, to_emails: str, dynamic_template_object: Dict[str, Any]
    ) -> None:
        """Sends an email based on a template stored in SendGrid
        :param dynamic_template_object: Data for a transactional template.
        :type dynamic_template_object: A JSON-serializable structure
        :param from: Sender of the email. The sender's email domain needs to have been authenticated and added to SendGrid Dashboard.
        :type from:  string
        :param from: Email of the recipient
        :type from:  string
        """

        emails_stats = self._get_daily_stats()

        scheduled_time = self._get_send_time(emails_stats)

        message = Mail()

        message.to = To(to_emails)
        message.from_email = From(from_email, "Stager Team")
        message.send_at = SendAt(math.ceil(scheduled_time))
        message.dynamic_template_data = dynamic_template_object
        message.template_id = self.app.config["SENDGRID_EMAIL_TEMPLATE_ID"]

        try:
            self.sg.send(message)
            self.app.logger.debug(
                f"Email successfully sent from {from_email} to {to_emails}"
            )
        except Exception as e:
            self.app.logger.error("Failed to send email...")
            self.app.logger.error(e)

    def _get_daily_stats(self):
        today = datetime.now().strftime("%Y-%m-%d")
        params = {
            "aggregated_by": "day",
            "start_date": today,
            "end_date": today,
            "offset": 1,
        }
        try:
            response = self.sg.client.stats.get(query_params=params)
            return json.loads(response.body.decode("utf-8"))
        except Exception as e:
            self.app.logger.error("Failed to get daily email stats")
            self.app.logger.debug(e)
            return []

    def _get_send_time(self, stats):
        limit_per_day = 100
        send_at = datetime.now()

        for stat in stats:

            requests_count = sum(
                [r.get("metrics").get("requests") for r in stat.get("stats")]
            )

            if stat.get("date") == datetime.strftime(send_at, "%Y-%m-%d"):
                if requests_count < limit_per_day:
                    send_at = send_at + timedelta(seconds=15)
                else:
                    send_at = send_at + timedelta(days=1, seconds=15)

        return send_at.timestamp()

    def send_notification(self):
        """
        This is a scheduled background task. Because it runs in a separate thread,
        it pushes an app context for itself.
        """
        with self.app.app_context():
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
                        "priority": analysis.priority,
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
                self.send(
                    to_emails=self.app.config["SENDGRID_TO_EMAIL"],
                    from_email=self.app.config["SENDGRID_FROM_EMAIL"],
                    dynamic_template_object={"analyses": email_analyses},
                )

            self.app.logger.debug(
                f"{len(email_analyses)} analysis requests found... {json.dumps(email_analyses)}"
            )
