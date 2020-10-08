import pytest
from typing import *
from app import *
from flask.testing import Client


def login(client: Client, username: str, password: str):
    """ Attempt to login using the provided credentials with the client. """
    return client.post('/api/login', data=dict(
        username=username,
        password=password
    ), follow_redirects=True)


def logout(client):
    """ Logout this client. """
    return client.post('/api/logout', follow_redirects=True)
