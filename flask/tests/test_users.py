import pytest
from conftest import TestConfig
from app.madmin import MinioAdmin, readwrite_buckets_policy

# Common response values between list and individual get endpoints
expected_admin_common = {
    "username": "admin",
    "email": "noreply@sickkids.ca",
    "is_admin": True,
    "deactivated": False,
    "groups": [],
}

expected_user_common = {
    "username": "user",
    "email": "test@sickkids.ca",
    "is_admin": False,
    "deactivated": False,
    "groups": ["ach"],
}


@pytest.fixture
def minio_policy():
    # Under normal operations this would already be created by precondition
    madmin = MinioAdmin(
        endpoint=TestConfig.MINIO_ENDPOINT,
        access_key=TestConfig.MINIO_ACCESS_KEY,
        secret_key=TestConfig.MINIO_SECRET_KEY,
    )
    madmin.add_policy("ach", readwrite_buckets_policy("ach"))
    yield madmin
    try:
        madmin.remove_policy("ach")
    except:
        pass


def test_list_users(test_database, client, login_as):
    login_as("admin")
    response = client.get("/api/users")
    assert response.status_code == 200

    user_list = response.get_json()
    assert len(user_list) == 2

    # return order is unspecified
    user_list.sort(key=lambda user: user["username"])

    assert user_list == [
        {
            **expected_admin_common,
            "last_login": user_list[0]["last_login"],  # don't know this value
        },
        {
            **expected_user_common,
            "last_login": user_list[1]["last_login"],
        },
    ]


def test_list_users_unauthorized(test_database, client, login_as):
    login_as("user")
    assert client.get("/api/users").status_code == 401


def test_get_user_admin(test_database, minio_policy, client, login_as):
    login_as("admin")
    assert client.get("/api/users/foo").status_code == 404

    response = client.get("/api/users/admin")
    assert response.status_code == 200
    admin = response.get_json()
    assert admin == {
        **expected_admin_common,
        "last_login": admin["last_login"],  # don't know this value
        "minio_access_key": "admin",
        "minio_secret_key": None,  # usually either both are set or both are null
    }

    response = client.get("/api/users/user")
    assert response.status_code == 200
    user = response.get_json()
    assert user == {
        **expected_user_common,
        "last_login": user["last_login"],  # don't know this value
        "minio_access_key": "user",
        "minio_secret_key": None,  # usually either both are set or both are null
    }


def test_get_user_user(test_database, client, login_as):
    assert client.get("/api/users/foo").status_code == 401
    assert client.get("/api/users/user").status_code == 401

    login_as("user")
    assert client.get("/api/users/foo").status_code == 401
    assert client.get("/api/users/admin").status_code == 401

    response = client.get("/api/users/user")
    assert response.status_code == 200
    user = response.get_json()
    assert user == {
        **expected_user_common,
        "last_login": user["last_login"],  # don't know this value
        "minio_access_key": "user",
        "minio_secret_key": None,  # usually either both are set or both are null
    }


def assert_reset(username: str, client):
    assert client.post(f"/api/users/{username}").status_code == 415
    response = client.post(f"/api/users/{username}", json={"no": "html forms"})
    assert response.status_code == 200
    credentials = response.get_json()
    assert isinstance(credentials["minio_access_key"], str)
    assert isinstance(credentials["minio_secret_key"], str)

    user = client.get(f"/api/users/{username}").get_json()
    assert user["minio_access_key"] == credentials["minio_access_key"]
    assert user["minio_secret_key"] == credentials["minio_secret_key"]


def test_reset_minio_admin(test_database, minio_policy, client, login_as):
    login_as("admin")
    assert client.post("/api/users/foo").status_code == 415
    assert (
        client.post("/api/users/foo", json={"oh love me": "mister"}).status_code == 404
    )

    assert_reset("admin", client)
    assert_reset("user", client)


def test_reset_minio_user(test_database, minio_policy, client, login_as):
    assert client.post("/api/users/foo").status_code == 401
    assert client.get("/api/users/user").status_code == 401

    login_as("user")
    assert client.post("/api/users/foo").status_code == 401
    assert client.post("/api/users/admin").status_code == 401

    assert_reset("user", client)
