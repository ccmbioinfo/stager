# using SendGrid's Python Library
# https://github.com/sendgrid/sendgrid-python
import os
import json
from datetime import datetime, timedelta
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail, SendAt, To, From, Subject, Content, MimeType
from flask import current_app as app
from pytz import timezone
import math


sg = SendGridAPIClient(os.environ.get("SENDGRID_API_KEY"))

tz = timezone("EST")


def send_email(from_email, to_emails, subject, content):

    emails_stats = get_daily_stats()

    scheduled_time = get_send_time(emails_stats)

    message = Mail()

    message.to = To(to_emails)
    message.from_email = From(from_email)
    message.subject = Subject(subject)
    message.content = Content(MimeType.text, content)
    message.send_at = SendAt(math.ceil(scheduled_time))

    try:
        sg.send(message)
        print(
            f"Email successfully sent from {from_email} to {to_emails} at {datetime.fromtimestamp(scheduled_time, tz)}"
        )
    except Exception as e:
        app.logger.error("Failed to send email...")
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
                send_at = send_at + timedelta(minutes=3)
            else:
                send_at = send_at + timedelta(days=1, minutes=3)

    return send_at.timestamp()


def stringify_date(date):
    return datetime.strftime(date, "%Y-%m-%d")
