from locust import HttpUser, task
from locust.user.wait_time import between

LOGIN_CREDENTIALS = {"username": "admin", "password": "newsecret"}


class TestUser(HttpUser):
    wait_time = between(0.5, 2)

    def on_start(self):
        print("Starting...")

    def login(self):
        self.client.post("/api/login", json=LOGIN_CREDENTIALS)

    @task(2)
    def get_api_info(self):
        self.client.get("/api")
