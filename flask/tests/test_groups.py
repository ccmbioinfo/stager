import pytest
from app import db, models
from sqlalchemy.orm import joinedload
from conftest import TestConfig
from app.madmin import MinioAdmin, stager_buckets_policy
from minio import Minio


@pytest.fixture
def minio_admin():
    madmin = MinioAdmin(
        endpoint=TestConfig.MINIO_ENDPOINT,
        access_key=TestConfig.MINIO_ACCESS_KEY,
        secret_key=TestConfig.MINIO_SECRET_KEY,
    )
    # To match test_database on the minio side
    madmin.add_user("user", "useruser")
    madmin.add_user("admin", "adminadmin")
    madmin.group_add("ach", "user")
    madmin.group_add("admin", "admin")
    madmin.add_policy("ach", stager_buckets_policy("ach"))
    madmin.set_policy("ach", group="ach")
    madmin.set_policy("readwrite", group="admin")
    yield madmin
    # Teardown
    try:
        madmin.remove_user("user")
    except:
        pass
    try:
        madmin.remove_user("admin")
    except:
        pass
    try:
        madmin.group_remove("ach")
    except:
        pass
    try:
        madmin.group_remove("admin")
    except:
        pass
    try:
        madmin.remove_policy("ach")
    except:
        pass


# Tests

# GET /api/groups


def test_no_groups(test_database, client, login_as):
    login_as("admin")

    response = client.get("/api/groups?user=5")
    assert response.status_code == 200
    assert len(response.get_json()) == 0


def test_list_groups_admin(test_database, client, login_as):
    login_as("admin")

    response = client.get("/api/groups")
    assert response.status_code == 200
    assert len(response.get_json()) == 2


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
    assert client.get("/api/groups/hahah").status_code == 404

    group_2 = models.Group(group_code="alas", group_name="...")
    db.session.add(group_2)
    db.session.commit()

    # Test wrong permissions
    login_as("user")
    assert client.get("/api/groups/alas").status_code == 404

    # Test and validate success based on user's permissions
    response = client.get("/api/groups/ach")
    assert response.status_code == 200
    assert response.get_json()["group_name"] == "Alberta"


# DELETE /api/groups/:id


def test_delete_group(test_database, client, login_as, minio_admin):
    prev_minio_groups = len(minio_admin.list_groups())

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
    minio_admin.remove_user("user")

    login_as("admin")
    assert client.delete("/api/groups/ach").status_code == 204

    # Make sure it's gone
    group = models.Group.query.filter_by(group_code="ach").one_or_none()
    assert group == None
    assert len(minio_admin.list_groups()) == prev_minio_groups - 1


# PATCH /api/groups/:id


def test_update_group(test_database, client, login_as, minio_admin):
    login_as("admin")
    # Test existence
    assert (
        client.patch("/api/groups/code", json={"group_name": "yes"}).status_code == 404
    )

    assert (
        client.patch(
            "/api/groups/ach", json={"group_name": "Alberta2", "users": ["admin"]}
        ).status_code
        == 200
    )
    # Make sure it updated
    group = models.Group.query.filter(
        models.Group.group_name == "Alberta2"
    ).one_or_none()
    assert group is not None
    assert len(group.users) == 1
    assert group.users[0].username == "admin"

    # Reset
    assert (
        client.patch(
            "/api/groups/ach", json={"group_name": "Alberta", "users": ["user"]}
        ).status_code
        == 200
    )


# POST /api/groups


def test_create_group(test_database, client, login_as, minio_admin):
    login_as("user")
    assert client.post("/api/groups").status_code == 401

    login_as("admin")
    # Test no group_code given
    assert (
        client.post(
            "/api/groups",
            json={"A json you say?": "How could you possibly be so naive"},
        ).status_code
        == 400
    )
    # Test group_code already in use
    assert (
        client.post(
            "/api/groups",
            json={"group_code": "ach", "group_name": "Nothing suspicious"},
        ).status_code
        == 422
    )
    # Test invalid bucket name
    assert (
        client.post(
            "/api/groups",
            json={"group_code": "sk", "group_name": "Invalid s3 bucket name"},
        ).status_code
        == 422
    )

    num_prev_policies = len(minio_admin.list_policies())

    # Test success with no users and check db and minio
    assert (
        client.post(
            "/api/groups",
            json={"group_code": "code", "group_name": "Actually nothing suspicious"},
        ).status_code
        == 201
    )
    group = models.Group.query.filter(models.Group.group_code == "code").one_or_none()
    assert group is not None
    assert len(group.users) == 0
    assert len(minio_admin.list_policies()) == num_prev_policies + 1
    minio_client = Minio(
        TestConfig.MINIO_ENDPOINT,
        access_key=TestConfig.MINIO_ACCESS_KEY,
        secret_key=TestConfig.MINIO_SECRET_KEY,
        secure=False,
    )
    # Clean up
    minio_client.remove_bucket("code")
    minio_admin.remove_policy("code")

    # Test success with users and check db and minio
    user = models.User.query.filter(models.User.username == "user").one_or_none()
    user.minio_access_key = "user"

    assert (
        client.post(
            "/api/groups",
            json={
                "group_code": "code2",
                "group_name": "Actually nothing else suspicious",
                "users": ["user"],
            },
        ).status_code
        == 201
    )
    group = models.Group.query.filter(models.Group.group_code == "code2").one_or_none()
    assert group is not None
    assert len(group.users) == 1
    assert len(minio_admin.list_policies()) == num_prev_policies + 1
    assert len(minio_admin.get_group("code2")["members"]) == 1
    minio_client = Minio(
        TestConfig.MINIO_ENDPOINT,
        access_key=TestConfig.MINIO_ACCESS_KEY,
        secret_key=TestConfig.MINIO_SECRET_KEY,
        secure=False,
    )
    # Clean up
    minio_client.remove_bucket("code2")
    minio_admin.remove_policy("code2")
    minio_admin.remove_user("user")
    minio_admin.group_remove("code2")
