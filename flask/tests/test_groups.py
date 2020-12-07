import pytest
from app import db, models
from sqlalchemy.orm import joinedload
from conftest import TestConfig
from app.madmin import MinioAdmin

# Tests

# GET /api/groups


def test_no_groups(test_database, client, login_as):
    login_as("admin")

    response = client.get("/api/groups?user=3")
    assert response.status_code == 200
    assert len(response.get_json()) == 0


def test_list_groups_admin(test_database, client, login_as):
    login_as("admin")

    response = client.get("/api/groups")
    assert response.status_code == 200
    assert len(response.get_json()) == 1


def test_list_groups_user(test_database, client, login_as):
    login_as("user")

    response = client.get("/api/groups")
    assert response.status_code == 200
    # Check number of groups
    assert len(response.get_json()) == 1


def test_list_groups_user_from_admin(test_database, client, login_as):
    # Repeat above test from admin's eyes
    login_as("admin")

    response = client.get("/api/groups?user=2")
    assert response.status_code == 200
    # Check number of groups
    assert len(response.get_json()) == 1


# GET /api/groups/:id


def test_get_group(test_database, client, login_as):
    # Test invalid group_code
    login_as("admin")
    assert client.get("/api/groups/hahah").status_code == 403

    group_2 = models.Group(group_code="alas", group_name="...")
    db.session.add(group_2)
    db.session.commit()

    # Test wrong permissions
    login_as("user")
    assert client.get("/api/groups/alas").status_code == 403

    # Test and validate success based on user's permissions
    login_as("user")
    response = client.get("/api/groups/ach")
    assert response.status_code == 200
    assert response.get_json()["group_name"] == "Alberta"


# DELETE /api/groups/:id


def test_delete_group(test_database, client, login_as):
    # Simulate minio group equivalent of test_database
    minioAdmin = MinioAdmin(
        endpoint=TestConfig.MINIO_ENDPOINT,
        access_key=TestConfig.MINIO_ACCESS_KEY,
        secret_key=TestConfig.MINIO_SECRET_KEY,
    )
    minioAdmin.add_user("user", "useruser")
    minioAdmin.group_add("ach", "user")

    # Test without permission
    login_as("user")
    response = client.delete("/api/groups/haha")
    assert response.status_code == 401

    # Test with wrong code
    login_as("admin")
    response = client.delete("/api/groups/noCodeHere")
    assert response.status_code == 404

    # Test with user in it
    login_as("admin")
    response = client.delete("/api/groups/ach")
    assert response.status_code == 422

    # Standard test, need to clear users first
    group = models.Group.query.filter_by(group_code="ach").one_or_none()
    group.users = []

    db.session.commit()
    minioAdmin.remove_user("user")

    login_as("admin")
    assert client.delete("/api/groups/ach").status_code == 204

    # Make sure it's gone
    group = models.Group.query.filter_by(group_code="ach").one_or_none()
    assert group == None
    assert len(minioAdmin.list_groups()) == 0


"""


# PATCH /api/groups/:id


def test_update_family(test_database, client, login_as):
    login_as("user")
    # Test existence
    assert (
        client.patch("/api/groups/4", json={"family_codename": "C"}).status_code
        == 404
    )

    # Test permission
    assert (
        client.patch("/api/groups/2", json={"family_codename": "C"}).status_code
        == 404
    )

    # Test no codename error
    assert (
        client.patch(
            "/api/groups/2",
            json={"Haha you thought it was a codename": "but it was I, useless json"},
        ).status_code
        == 400
    )

    # Test success
    assert (
        client.patch("/api/groups/1", json={"family_codename": "C"}).status_code
        == 200
    )
    # Make sure it updated
    family = models.Family.query.filter(models.Family.family_id == 1).one_or_none()
    assert family.family_codename == "C"


# POST /api/groups


def test_create_family(test_database, client, login_as):
    login_as("user")
    assert client.post("/api/groups").status_code == 401

    login_as("admin")
    # Test no codename given
    assert (
        client.post(
            "/api/groups",
            json={"Haha you thought it was a codename": "but it was I, useless json"},
        ).status_code
        == 400
    )
    # Test codename already in use
    assert (
        client.post(
            "/api/groups",
            json={"family_codename": "A"},
        ).status_code
        == 422
    )
    # Test success and check db
    assert (
        client.post(
            "/api/groups",
            json={
                "family_codename": "C",
            },
        ).status_code
        == 201
    )
    family = models.Family.query.filter(
        models.Family.family_codename == "C"
    ).one_or_none()
    assert family is not None

    login_as("admin")
    assert len(client.get("/api/groups").get_json()) == 3
"""
