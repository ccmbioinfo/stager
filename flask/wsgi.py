#!/usr/bin/env python3
import atexit
from app import config, create_app, tasks, cache
from apscheduler.schedulers.background import BackgroundScheduler

app = create_app(config.Config)

scheduler = BackgroundScheduler(timezone="America/Toronto")
# scheduler.add_job(
#     tasks.send_email_notification, "cron", day_of_week="mon-fri", hour="17", minute="58"
# )

scheduler.add_job(tasks.print_date_time, "interval", seconds=3)
scheduler.start()

# Shut down the scheduler when exiting the app

atexit.register(lambda: scheduler.shutdown())

if __name__ == "__main__":
    app.run()
