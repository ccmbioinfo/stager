import pytest
from app import db, models

# Helper functions

USERNAME = "testuser"
EMAIL = "testuser@example.com"
PASSWORD = "password"


def add_test_user():
    user = models.User(username=USERNAME, email=EMAIL)
    user.set_password(PASSWORD)

    db.session.add(user)
    db.session.commit()


def login(client, username, password):
    """ Attempt to login using the provided credentials with the client. """
    return client.post(
        "/api/login",
        json={"username": username, "password": password},
        follow_redirects=True,
    )


def logout(client):
    """ Logout this client. """
    return client.post("/api/logout", json={"dummy": True}, follow_redirects=True)


# Test cases


def test_login_logout(client):
    """ Tests logging in and out. Also tests last_login. """
    add_test_user()

    # Logging in with correct credentials
    res = login(client, USERNAME, PASSWORD)

    assert res.status_code == 200

    data = res.get_json()

    assert data["username"] == USERNAME
    assert data["last_login"] is None  # Never logged in before
    # assert user.is_authenticated

    # Logging out
    res = logout(client)
    assert res.status_code == 204
    assert res.data == b""
    # assert not user.is_authenticated

    # Logging in a second time
    res = login(client, USERNAME, PASSWORD)

    assert res.status_code == 200

    data = res.get_json()

    assert data["username"] == USERNAME
    assert data["last_login"] is not None  # Second time logging in
    # assert user.is_authenticated


def test_wrong_credentials(client):
    """ Tests response to invalid login credentials. """
    add_test_user()

    # Logging in with wrong username
    res = login(client, USERNAME + "x", PASSWORD)

    assert res.status_code == 401
    assert res.data == b"Unauthorized"

    # Logging in with wrong password
    res = login(client, USERNAME, PASSWORD + "x")

    assert res.status_code == 401
    assert res.data == b"Unauthorized"
