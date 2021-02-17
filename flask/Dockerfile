# Development image only. Runs a Flask development server.
FROM minio/mc:RELEASE.2021-02-07T02-02-05Z AS mc
FROM python:3.7-slim
WORKDIR /usr/src/stager
# Install PyPI packages first and then copy the MinIO client as the latter updates more frequently
COPY requirements-dev.txt .
RUN pip3 install -r requirements-dev.txt
COPY --from=mc /usr/bin/mc /usr/bin/mc
# Prevent accidentally running this image in production.
# Must mount the source code in the working directory to run this image.
# COPY . .
EXPOSE 5000
ENTRYPOINT ["./utils/wait-for-it.sh", "mysql:3306", "--timeout=0", "--", "./utils/run.sh"]
# Allows us to replace the parameters to run tests or formatters instead of the app.
CMD ["--host=0.0.0.0"]
