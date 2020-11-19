import pytest
from flask import request, jsonify, current_app as app


def login_as(client, identity):
    return client.post(
        "/api/login",
        json={"username": identity, "password": identity},
        follow_redirects=True,
    )


def test_list_datasets_admin(client, test_database):
    assert login_as(client, "admin").status_code == 200

    response = client.get("/api/datasets")
    assert response.status_code == 200
    assert len(response.get_json()) == 4

    response = client.get("/api/datasets?user=1")
    assert response.status_code == 200
    assert len(response.get_json()) == 0

    response = client.get("/api/datasets?user=2")
    assert response.status_code == 200
    assert len(response.get_json()) == 2

    response = client.get("/api/datasets?user=400")
    assert response.status_code == 200
    assert len(response.get_json()) == 0


def test_list_datasets_user(client, test_database):
    assert login_as(client, "user").status_code == 200

    response = client.get("/api/datasets")
    assert response.status_code == 200
    assert len(response.get_json()) == 2

    response = client.get("/api/datasets?user=1")
    assert response.status_code == 200
    assert len(response.get_json()) == 2

    response = client.get("/api/datasets?user=2")
    assert response.status_code == 200
    assert len(response.get_json()) == 2

    response = client.get("/api/datasets?user=400")
    assert response.status_code == 200
    assert len(response.get_json()) == 2
