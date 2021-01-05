# Stager

For more developer documentation, see [`docs/`](https://github.com/ccmbioinfo/stager/tree/master/docs/)

## Tech stack

- [MySQL 8.0](https://dev.mysql.com/doc/refman/8.0/en/)
- [MinIO](https://docs.min.io/)
- Python 3.7/[Flask](https://flask.palletsprojects.com/en/1.1.x/)
- [TypeScript](https://www.typescriptlang.org/docs)/[Create React App](https://create-react-app.dev/docs/getting-started/)

## Tools and editors

- [Git](https://git-scm.com/doc)
- [Docker](https://docs.docker.com/engine/install/) and [Compose](https://docs.docker.com/compose/install/)
- [Visual Studio Code](https://code.visualstudio.com/) or [PyCharm](https://www.jetbrains.com/pycharm/)

## No Docker

### Database
Ensure the MySQL service is running. Then access its shell:
```bash
mysql -uroot
create user 'admin'@'localhost' identified by 'admin';
create database st2020;
grant all privileges on st2020.* to 'admin'@'localhost';
```
You can change the database and username appropriately, but you will need to
set your ST_DATABASE_URI environment variable appropriately in that event.
This is used in `flask/app/config.py`.

### Application server
Flask does not work with Python 3.8 and newer!
Switch to the `flask` directory and install dependencies with `pip3 install -r requirements-dev.txt`.
You can use a virtualenv or whatever workflow suits you.

To start the development server, do `./utils/run.sh`. Additional parameters are passed to Flask,
so you can do `./utils/run.sh --host=0.0.0.0` to make your development server accessible externally.
Set FLASK_ENV=development to watch files and FLASK_DEBUG=1 to enable debugging.

If you're not using a virtualenv, `run.sh` supports setting envvars PYTHON and COMMAND to choose your Python interpreter.
By default, it runs `python3 -m flask`, but you can set `COMMAND=flask` to have it call `flask`,
or PYTHON=python3.7 to have it call `python3.7 -m flask`.

In PyCharm, you can open the entire repository as a project and set `flask` as a source folder
so it finds the main `app` module correctly. Then you can add a Flask server run configuration and enjoy!

Dependencies are added with [pip-tools](https://github.com/jazzband/pip-tools). Add the dependency line to
`requirements.in` and run `pip-compile requirements.in` to update `requirements.txt`.

In production, Flask should not be used as a server. We use Gunicorn, a WSGI application server, which is
included in the requirements. For example, `gunicorn --bind 0.0.0.0:5000 --preload --workers 1 --threads 2 wsgi:app`
will prefork one worker child process with two threads to serve up the Flask routes, listening on port 5000.

N.B. If using `contains_eager` in a SQLAlchemy query, do not use `first_or_404`
as this will affect each collection, so each collection will contain at most
one item, which is certainly not the intent. Use `one_or_none` instead in this case.
### Web frontend
You will need a recent Node.js and Yarn (`npm install -g yarn`).
1. Switch to the `react` directory.
1. Create a `.env` with these parameters that you can change as needed.
   ```
   REACT_APP_NAME=Stager
   REACT_APP_MINIO_URL=http://localhost:9000/
   ```
2. Install dependencies with `yarn`.
3. Start a development server in watch mode with `yarn start`.

You can build the static bundles for production with `yarn build`.

### Development
```bash
docker-compose up
```
This builds a `ccmbio/st2020` image with the Python dependencies and mounts the `flask` directory to watch for live changes.

Start the Create React App development server the [same way as the no-Docker workflow.](#web-frontend)

To rebuild the database after changes to the schema (i.e. to the `models.py` file)
```
docker-compose exec app bash
# and within the container:
flask db migrate -m "Commit message"
flask db upgrade
```
Exit out of the container, restart and the changes to the schema should be applied.

If the change is to an enum or something else that the isn't automatically picked up by flask migrate, you need to manually create the migration file by doing the following:

1. When the application is running, enter into the `ccmbio/st2020` container as described above and run:
```
flask db revision -m "message about change"
```
2. Navigate to the `migrations/versions` folder and open the file that was just created.
3. Edit the `upgrade`/`downgrade` functions by writing MySQL code directly in `op.execute("MYSQL CODE HERE)` calls
4. Shut down everything, update the `models.py` and restart

## Running tests

First, make sure all the `TEST_*` environment variables in `.env` are configured. See `sample.env` for examples.

To start the separate test service instances in the background, run:
```bash
docker-compose -p st2020test -f docker-compose.test.yaml up -d mysql minio
```
This step is optional because the following steps will start these containers anyway.

These containers do not have their ports exposed to the host like in development.
To expose them to the host (perhaps you want to run Python in a virtualenv), add the
`ports:` key to each service like in the regular `docker-compose.yaml`.

`-p` is short for `--project-name` and keeps these containers in a separate namespace
so they don't replace your regular development containers. To run in the foreground,
remove the `-d` flag.

Now you can run pytest with:
```bash
docker-compose -p st2020test -f docker-compose.test.yaml run --rm -T app
```
`--rm` removes the test container after it's done running. `-T` does not connect the TTY
or `mc` will dump some unexpected messages to stdout the first time and break its first test.

Alternatively, if you are using Python on your host machine, exposed the ports for these
containers (or other equivalent test servers), and set your environment variables as
needed by `flask/tests/conftest.py`:
```bash
python3 -m pytest
```
Note that just running `pytest` fails on module resolution for some reason and should be
investigated if we have free time.

To clean up these containers:
```bash
docker-compose -p st2020test -f docker-compose.test.yaml down
```
