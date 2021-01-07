# [Flask](https://flask.palletsprojects.com/) application backend server

Flask is a microframework for writing web applications in Python. At the time of
project initialization, it did not support Python 3.8 yet, so we are using
Python 3.7.

Using [Docker](https://github.com/ccmbioinfo/stager/blob/master/docs/docker.md)
will automatically set everything up for you and works well in general. For some
specific debugging and database purposes, you may need to set up a virtualenv.

## Setting up in a virtualenv

First, you will need Python 3.7, pip, and virtualenv. To create a virtualenv,
switch to the `flask` directory and run one of the following commands,
depending on how your Python installation is set up.

A virtualenv changes your PATH so Python modules resolve to dependencies
installed in this virtual environment, which helps keep projects separated
instead of polluting your global site packages.

```bash
virtualenv venv
# if the above doesn't work
python3 -m virtualenv
```

Then install dependencies through pip in the virtualenv.

```bash
. venv/bin/activate  # Activates the virtualenv. Run in a shell before dev work
pip3 install -r requirements-dev.txt
```

Install the [MinIO command-line client](https://docs.min.io/docs/minio-client-quickstart-guide.html)
and make sure that it is in PATH.

Assuming the supporting MySQL database server and MinIO server are up and access
credentials are in the environment variables, run

```bash
./utils/run.sh
```

Additional parameters are passed to Flask, so you can do
`./utils/run.sh --host=0.0.0.0` to make your development server accessible
externally (insecure). Set FLASK_ENV=development to watch files and restart
automatically, and FLASK_DEBUG=1 to enable debugging.

If you are using [PyCharm](https://github.com/ccmbioinfo/stager/blob/master/docs/pycharm.md)
the Flask server run configuration takes care of this for you, and you don't
need the startup helper script. The module it should use is `wsgi`.

The run script supports setting environment variables PYTHON and COMMAND to
choose your Python interpreter. By default, it runs `python3 -m flask`, but you
can set `COMMAND=flask` to have it call `flask` directly, or `PYTHON=python3.7`
to have it run `python3.7 -m flask`, for example.

## Adding or updating dependencies

Stager uses [pip-tools](https://github.com/jazzband/pip-tools) to manage
`requirements.txt` for production and `requirements-dev.txt` in development.
It needs to be installed separately and is not included in the Docker dev image
for now.

To add a runtime dependency, add a line specifying the name of the PyPI package
to `requirements.in`. Keep in mind to run these in a virtualenv if you are using
one!

```bash
pip-compile requirements.in
pip install -r requirements.txt
```

To add a development dependency, add the line to `requirements-dev.in` instead.

```bash
pip-compile requirements-dev.in
pip install -r requirements-dev.in
```

Commit the changes to Git. If you are using Docker, you should rebuild the image
for changes to persist.

## Application architecture

The backend is a RESTful API only. It is not responsible for serving the frontend or HTTPS.
The main entrypoint is [`wsgi.py`](https://github.com/ccmbioinfo/stager/blob/master/flask/wsgi.py),
which instructs Flask (or any WSGI server in [production](https://github.com/ccmbioinfo/stager/blob/master/docs/production.md))
to create an app instance with the default config and start the server to listen for HTTP requests.

Configuration is mostly read from environment variables in [`config.py`](https://github.com/ccmbioinfo/stager/blob/master/flask/app/config.py).
Because [Flask-Login](https://flask-login.readthedocs.io/) is authenticates via a session cookie by default,
in development, it is convenient to add `LOGIN_DISABLED = True` to the end of the config object for
testing your endpoints. Most routes are configured to assume that you are an admin if logins are
disabled, with an option to assume a specific user identity with `user=PRIMARY_KEY` in the request
query string.

The app instance is assembled in a factory function in [`__init__.py`](https://github.com/ccmbioinfo/stager/blob/master/flask/app/__init__.py).
Each subroute is loaded via a Flask [Blueprint](https://flask.palletsprojects.com/en/1.1.x/tutorial/views/).
This also registers the SQLAlchemy ORM and Flask-Migrate. More on this in the
[database docs](https://github.com/ccmbioinfo/stager/blob/master/docs/database.md).

The `add-default-admin` and `add-default-data` commands are registered to aid in development.
They are automatically run by the startup shell script. Most of the remaining files each
hold a Blueprint and implement a set of endpoints for that subroute.

## Tips

If using `contains_eager` in a SQLAlchemy query, do not use `first_or_404`
as this will affect each collection, so each collection will contain at most
one item, which is certainly not the intent. Use `one_or_none` instead in this case.

The actual SQL queries performed by SQLAlchemy are logged to ensure that we aren't
performing an unnecessary number of queries per request. If this is too cluttered,
set `SQLALCHEMY_LOG = False` in `config.py`.

If developing in Docker, to get a shell into the running app container, run

```bash
docker-compose exec app bash
```

To get a Python REPL in the Flask environment for quickly testing an idea, run

```bash
docker-compose exec app flask shell
```

If your editor is not configured to run the [Black formatter](https://black.readthedocs.io/)
automatically on save and you do not have it installed globally or in a virtualenv
(in which case you can just run `black` on the changed source files), you can
run the formatter in a Docker container before committing:

```bash
docker-compose run --rm app black
```

## [Pytest](https://docs.pytest.org/)

Pytest is used for integration [testing](https://github.com/ccmbioinfo/stager/tree/master/flask/tests)
the backend. This means that we need a separate test database in MySQL, and a separate testing MinIO
instance. Docker facilitates spinning these up really conveniently, but you can also manually create
a new database and a separate MinIO listening on a different port.

All endpoints should ideally have a set of comprehensive tests so we maintain confidence in
dependency updates, refactors, and new features implemented.
Each `test_*.py` file in the `tests` directory tests to a set of endpoints implemented by the
corresponding Blueprint in the `app` directory.

### Setting up

Make sure all the `TEST_*` environment variables in `.env` are set.
See [`sample.env`](https://github.com/ccmbioinfo/stager/blob/master/sample.env) for examples.
These are used to initialize a different config object in [`conftest.py`](https://github.com/ccmbioinfo/stager/blob/master/flask/tests/conftest.py).

To start the separate test service containers in the background, run

```bash
docker-compose -p stager-test -f docker-compose.test.yaml up -d mysql minio
```

This step is optional if you are running the tests in Docker, as the next
steps will start these containers anyway.

These containers do not have their ports exposed to the host like the usual
development containers. To expose them to the host, add the `ports:` key to each
service like in the the regular `docker-compose.yaml`. This is useful if
running pytest via PyCharm for debugging.

`-p` is short for `--project-name` and keeps these containers in a separate namespace
so they don't replace your regular development containers. To run in the foreground,
remove the `-d` flag.

To run pytest in Docker:

```bash
docker-compose -p stager-test -f docker-compose.test.yaml run --rm -T app
```

`--rm` removes the test container after it's done running.
`-T` is optional. It does not connect a TTY, which used to cause problems with a
particular test but has since been [resolved](https://github.com/minio/mc/issues/3499).

To run a specific test file or function instead of the entire test suite, append `pytest ARGUMENTS`
to the command above. For example, `pytest tests/test_users.py` will only run the integration tests
in the specified file. For more information, see [pytest usage](https://docs.pytest.org/en/stable/usage.html).

To run tests outside Docker, assuming the test services are accessible from the host
and configured in your environment variables, run

```bash
python3 -m pytest
```

Note that just running `pytest` fails as the working directory `flask` is not added
to the module resolution path, so the tests will fail to find the main `app` module.

To clean up the test service containers:

```bash
docker-compose -p stager-test -f docker-compose.test.yaml down
```
