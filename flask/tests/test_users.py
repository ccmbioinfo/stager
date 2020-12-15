import pytest


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


def test_get_user_admin(test_database, client, login_as):
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
