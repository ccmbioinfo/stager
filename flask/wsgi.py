#!/usr/bin/env python3
import atexit

import time
from app import config, create_app, tasks, cache
from apscheduler.schedulers.background import BackgroundScheduler

scheduler = BackgroundScheduler(timezone="America/Toronto")
scheduler.add_job(
    tasks.send_email_notification, "cron", day_of_week="mon-fri", hour="9"
)
scheduler.start()

# Shut down the scheduler when exiting the app

atexit.register(lambda: scheduler.shutdown())

app = create_app(config.Config)

if __name__ == "__main__":
    app.run()
