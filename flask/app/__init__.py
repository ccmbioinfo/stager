import logging
import os
from stat import S_ISFIFO

from flask import logging as flask_logging
from slurm_rest import Configuration


from .blueprints import register_blueprints
from .manage import register_commands
from .models import db
from .stager import Stager


def create_app(config):
    """
    The application factory. Returns an instance of the app.
    """
    # Create the application object
    app = Stager(config, db, __name__)

    config_logger(app)

    if app.config["SLURM_ENDPOINT"]:
        app.logger.info(
            "Configuring with Slurm REST API %s", app.config["SLURM_ENDPOINT"]
        )
        # Could instead use one environment variable and urllib.parse.urlsplit for this
        app.config["slurm"] = Configuration(
            host=app.config["SLURM_ENDPOINT"],
            api_key={
                "user": app.config["SLURM_USER"],
                "token": app.config["SLURM_JWT"],
            },
        )
    else:
        app.config["slurm"] = None

    register_commands(app)
    register_blueprints(app)

    return app


def config_logger(app):
    """
    Configure the main loggers: Flask application, SQLAlchemy, and werkzeug

    SQLAlchemy logs can be very noisy and hard to filter out with grep because
    the logged queries can span multiple lines. However, they are still useful
    for auditing query efficiency and performance. Therefore, instead of using
    basicConfig to configure the log handler and formatter at the root level,
    which affects all loggers, the SQLAlchemy logger is configured separately
    from the application logger.

    Configuring handlers to write to a file instead of stdout violates Docker's
    approach to logging. Instead, divert logs to a sidecar container so the
    SQLAlchemy logs are separated from application logs. The application
    container and the sidecar container both mount the same volume to share the
    logs. This solution is adapted from a Kubernetes paradigm.

    In production, SQLALCHEMY_SIDECAR specifies a writable filesystem path.
    Rather than using a regular file that would increase the disk space required
    for these logs and need to be rotated, use a FIFO or named pipe. This is
    equivalent to `app | sidecar`, but we cannot use a regular pipe across
    containers. This does not use disk space to redundantly store the logs, and
    the sidecar can still output the logs the same way with `tail`.
    """
    if app.config["SQLALCHEMY_LOG"]:
        sidecar = os.getenv("SQLALCHEMY_SIDECAR")
        if sidecar:
            try:
                os.mkfifo(sidecar)
            except FileExistsError:
                if not S_ISFIFO(os.stat(sidecar).st_mode):
                    raise
            handler = logging.FileHandler(sidecar)
        else:
            handler = logging.StreamHandler()
        handler.setFormatter(logging.Formatter("%(levelname)s [%(name)s] %(message)s"))
        logging.getLogger("sqlalchemy").addHandler(handler)
        logging.getLogger("sqlalchemy.engine").setLevel(logging.INFO)
        logging.getLogger("sqlalchemy.pool").setLevel(logging.INFO)
    # This configures Flask's logger and then we can customize it after
    flask_logging.create_logger(app)
    # %(asctime)s may be useful in development but redundant in production with journald
    flask_logging.default_handler.setFormatter(
        logging.Formatter("%(levelname)s [%(funcName)s, line %(lineno)s]: %(message)s")
    )
