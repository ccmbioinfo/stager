# Development image only. Runs a Flask development server.
FROM minio/mc AS mc
FROM python:3.7-slim as base
LABEL org.opencontainers.image.title Stager development
LABEL org.opencontainers.image.authors https://ccm.sickkids.ca/
LABEL org.opencontainers.image.source https://github.com/ccmbioinfo/stager
LABEL org.opencontainers.image.vendor Centre for Computational Medicine
WORKDIR /usr/src/stager
# Install PyPI packages first and then copy the MinIO client as the latter updates more frequently
COPY requirements-dev.txt .
RUN pip3 install -r requirements-dev.txt
COPY --from=mc /usr/bin/mc /usr/bin/mc
ENV FLASK_ENV development
# ENV FLASK_APP=wsgi.py
# Prevent accidentally running this image in production.
# Must mount the source code in the working directory to run this image.
EXPOSE 5000
ENTRYPOINT ["./utils/wait-for-it.sh", "mysql:3306", "--timeout=0", "--", "./utils/run.sh"]
# Allows us to replace the parameters to run tests or formatters instead of the app.
CMD ["--host=0.0.0.0"]

FROM base as debug

RUN pip install debugpy

ENV PYTHONDONTWRITEBYTECODE 1
# Turns off buffering for easier container logging
ENV PYTHONUNBUFFERED 1

