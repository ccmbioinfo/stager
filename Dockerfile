# Production image. Runs a Guicorn WSGI server.
FROM minio/mc:latest AS mc
FROM python:3.9.1-slim
WORKDIR /var/www/sample-tracker/flask
# Install PyPI prod-only packages first and then copy the MinIO client as the latter updates more frequently
COPY requirements.txt .
RUN pip3 install -r requirements.txt
COPY --from=mc /usr/bin/mc /usr/bin/mc
COPY . .
EXPOSE 5000
# Prevent accidentally using this image for development by adding the prod server arguments in the entrypoint
ENTRYPOINT ["./utils/wait-for-it.sh", "mysql:3306", "--timeout=0", "--", "./utils/run.sh", "prod", "--bind", "0.0.0.0:5000"]
CMD ["--preload", "--workers", "1", "--threads", "2"]
