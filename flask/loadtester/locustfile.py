from typing import Tuple, Union
from locust import FastHttpUser, task
from locust.user.wait_time import between

LOGIN_CREDENTIALS = {"username": "load.tester", "password": "loadtester"}
ABORT_ON_FAILURE = False


class TestUser(FastHttpUser):
    wait_time = between(0.5, 1)

    # helper
    def login(self, include_json=False) -> Tuple[bool, Union[dict, None]]:
        res = self.client.post("/api/login", json=LOGIN_CREDENTIALS)
        if res.status_code < 400:
            return True, res.json() if include_json else None
        return False, None

    def on_start(self):
        success, _ = self.login()
        if ABORT_ON_FAILURE and not success:
            self.stop()

    @task
    def post_login(self):
        self.login()

    @task
    def get_api_info(self):
        self.client.get("/api")

    @task
    def get_home_page(self):
        self.client.get("/api/participants")
