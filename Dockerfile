# Production image. Runs a Gunicorn WSGI server.
FROM minio/mc:RELEASE.2021-12-10T00-14-28Z AS mc
FROM python:3.10.1-slim
ARG GIT_SHA
LABEL org.opencontainers.image.title Stager production
LABEL org.opencontainers.image.authors https://ccm.sickkids.ca/
LABEL org.opencontainers.image.source https://github.com/ccmbioinfo/stager
LABEL org.opencontainers.image.vendor Centre for Computational Medicine
LABEL org.opencontainers.image.revision ${GIT_SHA}
ENV GIT_SHA=${GIT_SHA}
WORKDIR /usr/src/stager
# Install PyPI prod-only packages first and then copy the MinIO client as the latter updates more frequently
COPY requirements.txt .
RUN pip3 install --no-cache-dir -r requirements.txt
COPY --from=mc /usr/bin/mc /usr/bin/mc
COPY . .
ENV FLASK_ENV production
ENV PROMETHEUS_MULTIPROC_DIR /tmp
EXPOSE 5000 8080
# Prevent accidentally using this image for development by adding the prod server arguments in the entrypoint
# Automatically run migrations on startup
ENTRYPOINT ["./utils/run.sh", "prod", "--bind", "0.0.0.0:5000", "--access-logfile", "-", "--log-file", "-"]
