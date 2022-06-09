from prometheus_flask_exporter.multiprocess import GunicornPrometheusMetrics

from wsgi import app


# --preload https://docs.gunicorn.org/en/stable/settings.html#preload-app
# Initialize the app instance and threads in the master process. Workers are then
# forked from the master process, which does not preserve any threads. This is
# not specifically required to initialize a copy of the app instance in the master,
# as the import above will create one regardless, but in the absence of the import
# and the preload configuration, there would be no instance in the master.
preload_app = True
# --access-logfile - (stdout) https://docs.gunicorn.org/en/stable/settings.html#accesslog
accesslog = "-"
# --log-file - (stderr) https://docs.gunicorn.org/en/stable/settings.html#errorlog
errorlog = "-"


def when_ready(server):
    GunicornPrometheusMetrics.start_http_server_when_ready(8080)
    app.start_scheduler()


def child_exit(server, worker):
    GunicornPrometheusMetrics.mark_process_dead_on_child_exit(worker.pid)


def on_exit(server):
    app.scheduler.shutdown()
