# Production

Stager is deployed at https://sampletrackerdev.ccm.sickkids.ca via Compose.

## [nginx](https://hub.docker.com/_/nginx)

An nginx container is used to serve the static frontend files and as a reverse proxy to the
application server and MinIO. It is also solely responsible for HTTPS/TLS. Before starting up,
create an `nginx/certs` directory and copy the public certificate chain `bundle.crt` and the private
key `star_ccm_sickkids_ca.key` here.

## [WSGI and Gunicorn](https://gunicorn.org/#docs)

The Flask server is single-process and single-threaded. With the Python global interpreter lock,
even with development mode disabled, this is unsuitable for most production loads. Flask conforms
to a Python web server interface standard (WSGI), so we run a Gunicorn server in production, built
off of the `Dockerfile` in the root directory instead of the `flask` directory. Note that the
source code is no longer mounted but baked into the image.

There is no specific reason Gunicorn is being used over other WSGI implementations.

## Building the frontend

The frontend is currently served out of the same directory webpack uses to build, which means that
rebuilding will result in some downtime. To build the static bundles:

```bash
cd react
yarn
yarn build
```

## Running

We use an alternate Compose configuration to add nginx, run Gunicorn, and stop forwarding container
ports to the host unless explicitly required outside of development. The specific secret credentials
for this deployment must be in `.env` as in development.

```bash
docker-compose -f docker-compose.prod.yaml up -d
```

Assess the status of the containers:

```bash
docker-compose -f docker-compose.prod.yaml ps
```

Currently, a typical redeployment scenario involves manually performing these steps with some
downtime. Updated images may need to be pulled and the stale database bind mount reset.
