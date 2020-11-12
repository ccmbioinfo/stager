FROM minio/mc:latest AS mc
FROM python:3.7-slim
WORKDIR /var/www/sample-tracker/flask
COPY requirements.txt .
RUN pip3 install -r requirements.txt
COPY --from=mc /usr/bin/mc /usr/bin/mc
COPY . .
EXPOSE 5000
ENTRYPOINT ["./utils/wait-for-it.sh", "mysql:3306", "--timeout=0", "--", "./utils/run.sh"]
CMD ["--host=0.0.0.0"]
