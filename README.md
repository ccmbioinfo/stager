# ST2020

## Tech stack

- MySQL 8.0
- MinIO
- Python 3.7/Flask
- TypeScript/Create React App

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

### Web frontend
You will need a recent Node.js and Yarn (`npm install -g yarn`).
1. Switch to the `react` directory.
2. Install dependencies with `yarn`.
3. Start a development server in watch mode with `yarn start`.

You can build the static bundles for production with `yarn build`.

## With Docker and Docker Compose
Create a `.env` file with appropriate MySQL and MinIO credentials. See `sample.env` for which ones are needed.
These are used in `docker-compose.yaml` and `docker-compose.prod.yaml`.

### Development
```bash
docker-compose up
```
This builds a `ccmbio/st2020` image with the Python dependencies and mounts the `flask` directory to watch for live changes.

Start the Create React App development server the [same way as the no-Docker workflow.](#web-frontend)

To rebuild the database after changes to the schema (i.e. to the `models.py` file) run `docker ps -a`, note the CONTAINER ID of `ccmbio/st2020` , and run
```
docker exec -it <CONTAINER ID> /bin/bash
# and within the container:
flask db migrate -m "messsage about change"
flask db upgrade
```
Exit out of the container, restart and the changes to the schema should be applied.

If the change is to an enum or something else that the isn't automatically picked up by flask migrate, you need to manually create the migration file by doing the following:

1. When the application is running, enter into the `ccmbio/st2020` container as described above and run:
```
flask db revision -m "message about change"
```
2. Navigate to the `migrations/versions` folder and open the file that was just created.
3. Edit the `updgrade/downgrade` functions by writing MySQL code directly in `op.execute("MYSQL CODE HERE)` calls
4. Shut down everything, update the `models.py` and restart

### Production
1. Add `star_ccm_sickkids_ca.crt` and `star_ccm_sickkids_ca.key` to `nginx/certs`.
1. In the `react` directory, build the static bundles for nginx with `yarn build`.
1. In the project root:
```bash
docker-compose -f docker-compose.yaml -f docker-compose.prod.yaml up
```
This runs Gunicorn in the application container instead of Flask and does not bind mount the code.
This additionally starts Nginx with the static bundles, certifications, and main config bind mounted.
Nginx is solely responsible for HTTPS.

## Editor integrations

Make sure to get the EditorConfig extension for your editor.
PyCharm has this out of the box but VSCode requires an extension in the marketplace.

You can also get a Prettier integration for your editor to automatically format JavaScript code on save.

The [VSCode Python extension](https://code.visualstudio.com/docs/python/editing#_formatting)
can be configured fo Black as a code formatter and Pylint. PyCharm can also integrate Pylint with a plugin.
