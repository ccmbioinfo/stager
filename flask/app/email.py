# using SendGrid's Python Library
# https://github.com/sendgrid/sendgrid-python
import os
import json
from datetime import datetime, timedelta
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import (
    Mail,
    SendAt,
    To,
    From,
    Subject,
    Content,
    MimeType,
    BatchId,
)
from flask import current_app as app
from pytz import timezone
import math


sg = SendGridAPIClient(os.environ.get("SENDGRID_API_KEY"))

tz = timezone("EST")


def send_email(from_email, to_emails, subject, content, id):

    emails_stats = get_daily_stats()

    scheduled_time = get_send_time(emails_stats)

    batch_id = generate_batch_id()

    validate_batch_id(batch_id)

    message = Mail()

    message.to = To(to_emails)
    message.from_email = From(from_email)
    message.subject = Subject(subject)
    message.content = Content(MimeType.text, content)
    message.send_at = SendAt(math.ceil(scheduled_time))
    message.batch_id = BatchId(batch_id)

    try:
        app.logger.debug(message)
        sg.send(message)
        app.logger.info(
            f"Email successfully sent from {from_email} to {to_emails} at {datetime.fromtimestamp(scheduled_time, tz)}"
        )
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
                send_at = send_at + timedelta(minutes=55)
            else:
                send_at = send_at + timedelta(days=1, minutes=55)

    return send_at.timestamp()


def generate_batch_id():
    try:
        response = sg.client.mail.batch.post()
        app.logger.info(f"Successfully created new batch")
        app.logger.debug(response.status_code)
        app.logger.debug(response.body)
        batch = json.loads(response.body.decode("utf-8"))
        return batch.get("batch_id")
    except Exception as e:
        app.logger.error(f"Failed to create new batch")
        app.logger.error(e)


def validate_batch_id(id):
    try:
        response = sg.client.mail.batch._(id).get()
        app.logger.info(f"Whether batch id {id} is valid...")
        app.logger.debug(response.to_dict)
    except Exception as e:
        app.logger.error(f"Failed to validate batch with id {id}")
        app.logger.error(e)


def cancel_scheduled_send(id):
    try:
        request = {"batch_id": str(id), "status": "cancel"}
        response = sg.client.user.scheduled_sends.post(request_body=request)
        print("h1")
        print(response.to_dict)
    except Exception as e:
        app.logger.error(f"Failed to cancel scheduled send with id {id}")
        app.logger.error(e)


# To-do: Why does it return empty???
def retrieve_all_scheduled_sends():
    try:
        response = sg.client.user.scheduled_sends.get()
        app.logger.info("Retrieving all scheduled sends...")
        app.logger.debug(response.status_code)
        app.logger.debug(response.body)
        app.logger.debug(response.headers)
    except Exception as e:
        app.logger.error(f"Failed to retrieve all scheduled sends")
        app.logger.error(e)


# Utils


def stringify_date(date):
    return datetime.strftime(date, "%Y-%m-%d")
