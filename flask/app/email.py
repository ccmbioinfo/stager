# using SendGrid's Python Library
# https://github.com/sendgrid/sendgrid-python
import os
import json
from datetime import datetime, timedelta
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import (
    Asm,
    Mail,
    SendAt,
    To,
    From,
    Subject,
    GroupId,
)
from flask import current_app as app
from pytz import timezone
import math


sg = SendGridAPIClient(os.environ.get("SENDGRID_API_KEY"))

tz = timezone("EST")


def send_email(from_email, to_emails, subject, dynamic_template_object):

    emails_stats = get_daily_stats()

    scheduled_time = get_send_time(emails_stats)

    message = Mail()

    message.to = To(to_emails)
    message.from_email = From(from_email)
    message.subject = Subject(subject)
    message.send_at = SendAt(math.ceil(scheduled_time))
    message.dynamic_template_data = dynamic_template_object
    message.template_id = "d-a758270f93a44038b0e84f4c90950d41"
    message.asm = Asm(GroupId(20848))

    try:
        sg.send(message)
        app.logger.info(
            f"Email successfully sent from {from_email} to {to_emails} at {datetime.fromtimestamp(scheduled_time, tz)}"
        )
        app.logger.debug(message)
    except Exception as e:
        app.logger.error(f"Failed to send email {id}...")
        app.logger.error(e)


def get_daily_stats():
    today = datetime.now(tz).strftime("%Y-%m-%d")
    params = {
        "aggregated_by": "day",
        "start_date": today,
        "end_date": today,
        "offset": 1,
    }
    try:
        response = sg.client.stats.get(query_params=params)
        return json.loads(response.body.decode("utf-8"))
    except:
        app.logger.error("Failed to get daily email stats")
        return []


def get_send_time(stats):
    limit_per_day = 100
    send_at = datetime.now(tz)

    for stat in stats:

        requests_count = sum(
            [r.get("metrics").get("requests") for r in stat.get("stats")]
        )

        if stat.get("date") == stringify_date(send_at):
            if requests_count < limit_per_day:
                send_at = send_at + timedelta(minutes=1)
            else:
                send_at = send_at + timedelta(days=1, minutes=1)

    return send_at.timestamp()


# Utils


def stringify_date(date):
    return datetime.strftime(date, "%Y-%m-%d")
