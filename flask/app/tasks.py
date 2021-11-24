import os

from . import cache
from .email import send_email


def send_email_notification(app):
    with app.app_context():
        email_cache = cache.get("analyses_emails")
        app.logger.debug(email_cache)
        if email_cache is not None and os.getenv("SENDGRID_API_KEY") is not None:
            send_email(
                to_emails=os.getenv("SENDGRID_TO_EMAIL"),
                from_email=os.getenv("SENDGRID_FROM_EMAIL"),
                dynamic_template_object={"analyses": email_cache},
            )
