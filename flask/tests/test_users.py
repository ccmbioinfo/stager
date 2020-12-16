import pytest


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
            "username": "admin",
            "email": "noreply@sickkids.ca",
            "is_admin": True,
            "last_login": user_list[0]["last_login"],  # don't know this value
            "deactivated": False,
            "groups": [],
        },
        {
            "username": "user",
            "email": "test@sickkids.ca",
            "is_admin": False,
            "last_login": user_list[1]["last_login"],
            "deactivated": False,
            "groups": ["ach"],
        },
    ]


def test_list_users_unauthorized(test_database, client, login_as):
    login_as("user")
    assert client.get("/api/users").status_code == 401
