FROM python:3.7-slim
WORKDIR /var/www/sample-tracker/flask
COPY requirements.txt .
RUN pip3 install -r requirements.txt
COPY . .
EXPOSE 5000
CMD ["./utils/flask.sh", "--host=0.0.0.0"]
