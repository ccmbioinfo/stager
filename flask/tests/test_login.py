import pytest
from app import db, models
from flask import request, jsonify, current_app as app

# Helper functions

def login(client, username, password):
    """ Attempt to login using the provided credentials with the client. """
    return client.post('/api/login', json={
        'username': username,
        'password': password
    }, follow_redirects=True)


def logout(client):
    """ Logout this client. """
    return client.post('/api/logout', json={'dummy': True}, follow_redirects=True)

# Test cases

def test_login_logout(client):
    USERNAME = "testuser"
    EMAIL = "testuser@example.com"
    PASSWORD = "password"
    user = models.User(
        username=USERNAME,
        email=EMAIL
    )
    user.set_password(PASSWORD)

    db.session.add(user)
    db.session.commit()


    # Logging in with correct credentials
    res = login(client, USERNAME, PASSWORD)

    assert res.status_code == 200

    data = res.get_json()

    assert data['username'] == USERNAME
    assert data['last_login'] is None # Never logged in before
    # assert user.is_authenticated

    # Logging out
    res = logout(client)
    assert res.status_code == 204
    assert res.data == b''
    # assert not user.is_authenticated

    # Logging in with wrong username
    res = login(client, USERNAME + "x", PASSWORD)

    assert res.status_code == 401
    assert res.data == b'Unauthorized'

    # Logging in with wrong password
    res = login(client, USERNAME, PASSWORD + "x")

    assert res.status_code == 401
    assert res.data == b'Unauthorized'

    # Logging in a second time
    res = login(client, USERNAME, PASSWORD)
    data = res.get_json()

    assert data['username'] == USERNAME
    assert data['last_login'] is not None

