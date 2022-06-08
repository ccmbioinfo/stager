import json
import math
import os
from datetime import datetime, timedelta
from typing import Any, Dict

from flask import current_app as app
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import From, Mail, SendAt, To


# https://github.com/sendgrid/sendgrid-python
sg = SendGridAPIClient(os.getenv("SENDGRID_API_KEY"))


def send_email(
    from_email: str, to_emails: str, dynamic_template_object: Dict[str, Any]
) -> None:
    """Sends an email based on a template stored in SendGrid
    :param dynamic_template_object: Data for a transactional template.
    :type dynamic_template_object: A JSON-serializable structure
    :param from: Sender of the email. The sender's email domain needs to have been authenticated and added to SendGrid Dashboard.
    :type from:  string
    :param from: Email of the recipient
    :type from:  string
    """

    emails_stats = get_daily_stats()

    scheduled_time = get_send_time(emails_stats)

    message = Mail()

    message.to = To(to_emails)
    message.from_email = From(from_email, "Stager Team")
    message.send_at = SendAt(math.ceil(scheduled_time))
    message.dynamic_template_data = dynamic_template_object
    message.template_id = os.getenv("SENDGRID_EMAIL_TEMPLATE_ID")

    try:
        sg.send(message)
        app.logger.debug(f"Email successfully sent from {from_email} to {to_emails}")
    except Exception as e:
        app.logger.error("Failed to send email...")
        app.logger.error(e)


def get_daily_stats():
    today = datetime.now().strftime("%Y-%m-%d")
    params = {
        "aggregated_by": "day",
        "start_date": today,
        "end_date": today,
        "offset": 1,
    }
    try:
        response = sg.client.stats.get(query_params=params)
        return json.loads(response.body.decode("utf-8"))
    except Exception as e:
        app.logger.error("Failed to get daily email stats")
        app.logger.debug(e)
        return []


def get_send_time(stats):
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
