from .email import send_email
from . import cache
import os


def send_email_notification(app):
    with app.app_context():
        email_cache = cache.get("analyses_emails")
        app.logger.debug("Current email cache", email_cache)
        if email_cache is not None and os.getenv("SENDGRID_API_KEY") is None:
            try:
                send_email(
                    from_email="test@ccmdev.ca",
                    to_emails="giabaohan.le@sickkids.ca",
                    dynamic_template_object={"analyses": email_cache},
                )
            except Exception as e:
                print(e)
