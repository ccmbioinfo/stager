# using SendGrid's Python Library
# https://github.com/sendgrid/sendgrid-python
import os
import json
from datetime import date, datetime, timedelta
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail, SendAt
from flask import jsonify, current_app as app


sg = SendGridAPIClient(os.environ.get("SENDGRID_API_KEY"))


def send_email(from_email, to_emails, subject, content):
    message = Mail(
        from_email=from_email,
        to_emails=to_emails,
        subject=subject,
        html_content=content,
    )

    emails_stats = get_daily_stats()

    message.send_at = SendAt(get_send_time(emails_stats))

    try:
        sg.send(message)
        app.logger.info(f"Email successfully sent from {from_email} to {to_emails}...")
    except Exception as e:
        app.logger.error("Failed to send email...")
        app.logger.error(e)


def get_daily_stats():
    today = date.today().strftime("%Y-%m-%d")
    future = date.max.strftime("%Y-%m-%d")
    params = {
        "aggregated_by": "day",
        "limit": 1,
        "start_date": today,
        "end_date": future,
        "offset": 1,
    }
    try:
        response = sg.client.stats.get(query_params=params)
        print("body", response.body.decode("utf-8"))
        return response.body.decode("utf-8")
    except:
        app.logger.error("Failed to get daily email stats")
        return []


def get_send_time(stats):
    limit_per_day = 100
    send_at = datetime.now()
    yesterday = datetime.today() - timedelta(days=1)

    for stat in stats:

        requests_count = sum([r.metrics.requests for r in r.stats])
        date = stat.date.strptime(stat.date, "%Y-%m-%d")

        if requests_count < limit_per_day and date < send_at and date > yesterday:
            send_at = datetime.strptime(stat.date, "%Y-%m-%d")

    return send_at.timestamp()
