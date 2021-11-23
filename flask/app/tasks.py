from .email import send_email
from . import cache


def send_email_notification():
    email_cache = cache.get("analyses_emails")
    if email_cache != None:
        send_email(
            from_email="test@ccmdev.ca",
            to_emails="giabaohan.le@sickkids.ca",
            dynamic_template_object={"analyses": email_cache},
        )
        # Not working yet
        cache.set("analyses_emails", None)
