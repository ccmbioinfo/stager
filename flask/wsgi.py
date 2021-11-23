#!/usr/bin/env python3
import atexit

import time
from app import config, create_app, tasks, cache
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger


def print():
    app.logger.debug("Hello world at", time.strftime("%A, %d. %B %Y %I:%M:%S %p"))


scheduler = BackgroundScheduler()
scheduler.add_job(tasks.send_email_notification, "cron", day_of_week="mon-fri", hour=9)

scheduler.add_job(print, "cron", day_of_week="mon-fri", hour=9)
scheduler.start()

# Shut down the scheduler when exiting the app

atexit.register(lambda: scheduler.shutdown())

app = create_app(config.Config)

if __name__ == "__main__":
    app.run()
