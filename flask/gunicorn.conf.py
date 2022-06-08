from apscheduler.schedulers.background import BackgroundScheduler
from prometheus_flask_exporter.multiprocess import GunicornPrometheusMetrics

from flask.app.slurm import poll_slurm


scheduler = BackgroundScheduler()


def when_ready(server):
    GunicornPrometheusMetrics.start_http_server_when_ready(8080)
    scheduler.add_job(
        send_email_notification, "cron", [app], day_of_week="mon-fri", hour="9"
    )
    scheduler.add_job(poll_slurm, "interval", minutes=5) # match retention interval of Slurm
    scheduler.start()


def child_exit(server, worker):
    GunicornPrometheusMetrics.mark_process_dead_on_child_exit(worker.pid)


def on_exit(server):
    scheduler.shutdown()
