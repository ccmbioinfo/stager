# Databases and object-relational mapping

[MySQL 8.0](https://dev.mysql.com/doc/refman/8.0/en/) is the backing database for Stager. A single-
container deployment is included in the Compose stack. If you keep the default `.env` configuration,
storage will be persisted to the `mysql` directory bind mount, and you can communicate with this
server on your local machine on port 3306. This is not exposed to other devices.

If you need to configure a local MySQL server yourself for Stager after installing it outside of
Docker, first ensure that it is running and then access its shell:

```bash
mysql -uroot
create user 'admin'@'localhost' identified by 'admin';
create database stager;
grant all privileges on stager.* to 'admin'@'localhost';
```

Change the database and username appropriately and then update your `ST_DATABASE_URI` environment
variable used when starting the Flask development server to match.

## Accessing the database shell in Docker

```bash
docker-compose exec mysql mysql -uroot -p MYSQL_DATABASE
```

Enter your configured database root password when prompted.

## Object-relational mapping

SQL database represent data in the rows of relational tables. In contrast, programming languages
like Python represent data as individual objects. Object-relational mapping (ORM) libraries bridge
this gap by translating in both directions, creating an object-oriented abstraction for database
access.

[SQLAlchemy](https://docs.sqlalchemy.org/) is our choice of mapper for database access. We also use
[Flask-SQLAlchemy](https://flask-sqlalchemy.palletsprojects.com/) to simplify using SQLAlchemy in
a web context in a mostly transparent way: the SQLAlchemy database session is automatically created
and destroyed with the Flask application context per request.

[`models.py`](https://github.com/ccmbioinfo/stager/blob/master/flask/app/models.py) contains all
the mappings for Stager.

## Alembic migrations

The above initialization only creates an empty database in MySQL. The application still needs to
create the tables that correspond to its models and update the schemas for these tables if the
models change during the course of development.

We manage this through a the [Flask-Migrate](https://flask-migrate.readthedocs.io/) library, which
integrates the [Alembic](https://alembic.sqlalchemy.org/) migration tool for SQLAlchemy with Flask.
You should read Flask-Migrate's documentation if you need to do any work in this area.

### Workflow (`models.py` is changed in a way that affects the SQL representation)

Get a shell into the running app container (skip if using a virtualenv).

```bash
docker-compose exec app bash
```

Autogenerate an Alembic migration in [`migrations/versions`](https://github.com/ccmbioinfo/stager/tree/master/flask/migrations/versions).

```bash
flask db migrate -m "Commit message"
```

Verify the `upgrade` and `downgrade` functions in the file that was just created. Some changes are
not automatically detected by Alembic, such as to enums, and column renames may not be represented
ideally. Check constraints are also not applied and you may need to directly embed SQL code via
`op.execute("MYSQL CODE HERE")` calls.

Apply the migration and commit your changes to Git.

```bash
flask db upgrade
```

Because `flask db upgrade` is automatically called by the startup script [`./utils/run.sh`](https://github.com/ccmbioinfo/stager/blob/master/flask/utils/run.sh),
you may experience problems when switching between branches that expect different database versions.
Generally we just reset the database at this point, but you could avoid this by running
`flask db downgrade` to the last common revision between the branches. In Docker, the most
convenient way is to delete the bind mount (`rm -rf mysql`) while the container is down, and
otherwise you should drop all tables from the database used by Stager.

We may change the startup process to perform migrations in a separate container in the future.hpc.

### Reinitializing migrations

During rapid development, you may need to clean out Alembic migrations that don't actually have an
effect on real production data. You can do this by merging migrations through Flask-Migrate's
command-line.

In case we need to start over from scratch, first delete the migrations directory.

```bash
git rm -rf flask/migrations
```

If you are using Docker, get a shell with Flask-Migrate and database access.

```bash
docker-compose run --rm --entrypoint bash app
```

If you're feeling daring, you can do this in a running container instead.

```bash
docker-compose exec app bash
```

The initialization steps

```bash
flask db init
flask db migrate -m "Initial migration"
```

If the MySQL server is up, you need to reset the database or `flask db upgrade` will fail.
Commit the removed migrations and new initial migration to Git.
