# Production

Stager is deployed via Compose at https://stager.genomics4rd.ca to serve Care4Rare as part of Genomics4RD.
A separate multitenant deployment serves other collaborators at SickKids at https://stager.ccm.sickkids.ca.

The key differences between the development stack and production are that Gunicorn is used as the backend
server rather than the Flask development server and the frontend is served as built static bundles by a
reverse proxy, rather than by the Create React App/Webpack development server. Transport Layer Security
(HTTPS) is also enabled at the reverse proxy.

## [WSGI and Gunicorn](https://gunicorn.org/#docs)

The Flask server is single-process and single-threaded. With the Python global interpreter lock,
even with development mode disabled, this is unsuitable for most production loads. Flask conforms
to a Python web server interface standard (WSGI), so we run a Gunicorn server in production, built
off of the `Dockerfile` in the root directory instead of the `flask` directory. Note that the
source code is no longer mounted but baked into the image.

There is no specific reason Gunicorn is being used over other WSGI implementations.

## Static frontend

You can build the static bundles for production by running `yarn build` in the `react/` directory.
The server must be aware of the frontend single-page application routing, i.e. `/` and most paths
without an extension should be served by `index.html`, and that `/api` should route to the backend
server, since this isn't handled by the React development server anymore. This is handled by the
reverse proxy for each deployment.

## Continuous deployment through GitHub Actions

On each commit to master, a [GitHub Actions workflow](/.github/workflows/flask.yml) is run if anything
affecting the backend was changed. After the Docker image build and test stages pass, we move to the
deployment stage. This unlocks an environment that contains secrets specific to each deployment and
causes Actions to label this as a deployment. This stage runs on a self-hosted Actions runner that is
networked with the production host, and environment-specific secrets are used to access it to deploy.
Because of this, Actions workflows are disabled for forks for security.

At the same time, a different workflow [builds the frontend](/.github/workflows/react.yml),
incorporating environment-specific configurations as needed, and uploads the compiled static bundles
to a designated S3 (MinIO) bucket.

## [CHEO-RI deployment](https://stager.genomics4rd.ca)

This deployment serves [Care4Rare](http://care4rare.ca/) as part of [Genomics4RD](https://www.genomics4rd.ca/).
It runs on [HPC4Health](http://hpc4health.ca/) infrastructure in a dedicated tenancy referred to as
the CHEO-RI tenancy, or CHEO_G4RD.

Stager is deployed as a Docker container running Gunicorn per [docker-compose.cheo.yaml](/docker-compose.cheo.yaml).
Other needed services like MySQL and MinIO are separately already running in the tenancy. A reverse proxy for the entire
tenancy serves the uploaded frontend and routes `/api` on the same domain to the backend container.

## [CCM multitenant deployment](https://stager.ccm.sickkids.ca)

This deployment serves our other collaborators at SickKids. This is a multitenant deployment to keep
each lab's data separated. This is achieved by running one backend container per lab, each configured
to use a different database and MinIO server. The frontend is shared because the code for that stays
largely the same, but it is configured to be aware of multiple backend domains and route the API calls
appropriately. At the login page, the user selects their lab first, which configures the backend domain
for the app. An nginx reverse proxy handles all the domains and is responsible for serving the uploaded
frontend and routing to each backend, including enabling Cross-Origin Resource Sharing.

The Compose configuration is at [docker-compose.ccm.yaml](/docker-compose.ccm.yaml). For the time being,
we must clone the repository to the production host in order to have the nginx configuration there, and
we must place the needed TLS certificates in `nginx/certs`.
