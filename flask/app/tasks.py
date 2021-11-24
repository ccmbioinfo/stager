from .email import send_email
from . import cache
import time


def print_date_time():
    print(time.strftime("%A, %d. %B %Y %I:%M:%S %p"))


def send_email_notification():
    email_cache = cache.get("analyses_emails")
    if email_cache != None:
        print('this is cache', email_cache)
        try:
            send_email(
                from_email="test@ccmdev.ca",
                to_emails="giabaohan.le@sickkids.ca",
                dynamic_template_object={"analyses": email_cache},
            )
        except Exception as e:
            print(e)

        # Clear cache after email is sent
        cache.set("analyses_emails", None)
