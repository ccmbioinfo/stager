import json

import pytest
from app import db
from app.madmin import MinioAdmin, stager_buckets_policy
from app.models import User
from conftest import TestConfig

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

expected_user_a_common = {
    "username": "user_a",
    "email": "test_a@sickkids.ca",
    "is_admin": False,
    "deactivated": False,
    "groups": ["ach", "bcch"],
}

expected_user_b_common = {
    "username": "user_b",
    "email": "test_b@sickkids.ca",
    "is_admin": False,
    "deactivated": False,
    "groups": [],
}


@pytest.fixture
def minio_policy():
    # Under normal operations this would already be created by precondition
    madmin = MinioAdmin(
        endpoint=TestConfig.MINIO_ENDPOINT,
        access_key=TestConfig.MINIO_ACCESS_KEY,
        secret_key=TestConfig.MINIO_SECRET_KEY,
    )
    madmin.add_policy("ach", stager_buckets_policy("ach"))
    yield madmin
    try:
        madmin.remove_policy("ach")
    except:
        pass
    for user in madmin.list_users():
        try:
            madmin.remove_user(user["accessKey"])
        except:
            pass


def test_list_users(test_database, client, login_as):
    login_as("admin")
    response = client.get("/api/users")
    assert response.status_code == 200

    user_list = response.get_json()
    assert len(user_list) == 4

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
        {
            **expected_user_a_common,
            "last_login": user_list[2]["last_login"],
        },
        {
            **expected_user_b_common,
            "last_login": user_list[3]["last_login"],
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


def assert_new_user(body, client, login_as):
    response = client.post("/api/users", json=body)
    assert response.status_code == 201
    user = response.get_json()
    assert response.location.endswith(f"/api/users/{user['username']}")
    assert user["username"] == body["username"]
    assert user["email"] == body["email"]
    assert "password" not in user
    assert user["is_admin"] == body.get("is_admin", False)
    assert user["groups"] == body.get("groups", [])
    assert isinstance(user["minio_access_key"], str)
    assert isinstance(user["minio_secret_key"], str)
    login_as(body["username"], body["password"])


def test_create_user(test_database, client, login_as):
    assert client.post("/api/users").status_code == 401
    login_as("user")
    assert client.post("/api/users").status_code == 401
    assert client.post("/api/users", json={"xml": "bad"}).status_code == 401

    login_as("admin")
    assert client.post("/api/users").status_code == 415
    assert client.post("/api/users", json={"xml": "bad"}).status_code == 400
    assert client.post("/api/users", json={"username": "dormammu"}).status_code == 400
    assert (
        client.post(
            "/api/users",
            json={"username": "dormammu", "password": "I've come to bargain"},
        ).status_code
        == 400
    )

    assert_new_user(
        {
            "username": "dormammu",
            "password": "I've come to bargain",
            "email": "stephen.strange@agamotto.org",
        },
        client,
        login_as,
    )
    assert client.get("/api/users").status_code == 401


def test_create_admin(test_database, minio_policy, client, login_as):
    login_as("admin")
    assert_new_user(
        {
            "username": "vaccine",
            "password": "covid-19",
            "email": "mrna@example.org",
            "is_admin": True,
            "groups": ["ach"],
        },
        client,
        login_as,
    )
    assert client.get("/api/users").status_code == 200


def test_create_blank_user(test_database, client, login_as):
    login_as("admin")
    # Some defensive length checks
    users = [
        {"username": "", "email": "", "password": ""},
        {"username": "blank", "email": "blank@example.ca", "password": ""},
        {"username": "", "email": "blank@example.ca", "password": "blank"},
        {"username": "a" * 31, "email": "blank@example.ca", "password": "toolong"},
        {"username": "aaaaa", "email": "a" * 200 + "@f.ff", "password": "toolong"},
        {"username": "aaaaa", "email": "localhost", "password": "notanemail"},
    ]
    for user in users:
        assert client.post("/api/users", json=user).status_code == 400


def test_create_conflicting_user(test_database, client, login_as):
    login_as("admin")
    users = [
        {"username": "admin", "email": "unused@example.ca", "password": "fail"},
        {"username": "user", "email": "unused@example.ca", "password": "fail"},
        {"username": "adamant", "email": "noreply@sickkids.ca", "password": "fail"},
        {"username": "sapphire", "email": "test@sickkids.ca", "password": "fail"},
    ]
    for user in users:
        response = client.post("/api/users", json=user)
        assert response.status_code == 422
        error_json = response.get_json()
        assert "error" in error_json


def test_delete_unauthorized(test_database, client, login_as):
    users = ["admin", "user", "doesnotexist"]
    for user in users:
        assert client.delete(f"/api/users/{user}").status_code == 401

    login_as("user")
    for user in users:
        assert client.delete(f"/api/users/{user}").status_code == 401


def test_delete_user_with_datasets(test_database, client, login_as):
    login_as("admin")
    assert client.delete(f"/api/users/admin").status_code == 422


def test_delete_user(test_database, minio_policy, client, login_as):
    minio_admin = minio_policy
    minio_admin.add_user("user", "BatmanDiesInEndgame")
    user = User.query.filter_by(username="user").first()
    user.minio_access_key = "user"
    user.minio_secret_key = "BatmanDiesInEndgame"
    db.session.commit()

    login_as("admin")
    assert client.delete(f"/api/users/admin").status_code == 422
    assert client.delete(f"/api/users/user").status_code == 204
    with pytest.raises(RuntimeError) as exc:
        deleted = minio_admin.get_user("user")
    error = json.loads(exc.value.args[0])
    assert error["error"]["message"] == "Unable to get user info"
    assert error["error"]["cause"]["error"]["Code"] == "XMinioAdminNoSuchUser"
    assert User.query.filter_by(username="user").first() is None


def test_change_password_unauthorized(test_database, client, login_as):
    users = ["admin", "user", "doesnotexist"]
    for user in users:
        assert client.patch(f"/api/users/{user}").status_code == 401

    users = ["admin", "doesnotexist"]
    login_as("user")
    for user in users:
        assert client.patch(f"/api/users/{user}").status_code == 415
        assert (
            client.patch(f"/api/users/{user}", json={"password": "hunter2"}).status_code
            == 403
        )


def test_change_password(test_database, client, login_as):
    login_as("user")

    assert (
        client.patch(f"/api/users/user", json={"password": "hunter2"}).status_code
        == 400
    )
    assert (
        client.patch(
            f"/api/users/user", json={"current": "hunter2", "password": "hunter2"}
        ).status_code
        == 401
    )
    assert (
        client.patch(
            f"/api/users/user", json={"current": "user", "password": "hunter2"}
        ).status_code
        == 204
    )

    login_as("user", "hunter2")


def test_update_username(test_database, client, login_as):
    login_as("admin")

    response = client.patch("/api/users/user", json={"username": "thanos"})
    assert response.status_code == 200
    assert response.get_json()["username"] == "thanos"
    assert response.location.endswith(f"/api/users/thanos")
    assert client.get("/api/users/user").status_code == 404
    assert client.get("/api/users/thanos").status_code == 200


def test_update_username_conflict(test_database, client, login_as):
    login_as("admin")
    # TODO: should be 409 or something else in the future
    assert (
        client.patch("/api/users/user", json={"username": "admin"}).status_code == 400
    )


def test_deactivate_user(test_database, minio_policy, client, login_as):
    minio_admin = minio_policy
    minio_admin.add_user("user", "secretkey")
    user = User.query.filter_by(username="user").first()
    user.minio_access_key = "user"
    user.minio_secret_key = "secretkey"
    db.session.commit()

    login_as("admin")
    response = client.patch("/api/users/user", json={"deactivated": True})
    assert response.status_code == 200
    assert response.get_json()["deactivated"] is True
    assert response.get_json()["minio_access_key"] is None
    assert response.get_json()["minio_secret_key"] is None

    with pytest.raises(RuntimeError) as exc:
        deleted = minio_admin.get_user("user")
    error = json.loads(exc.value.args[0])
    assert error["error"]["message"] == "Unable to get user info"
    assert error["error"]["cause"]["error"]["Code"] == "XMinioAdminNoSuchUser"


def test_admin_change_password(test_database, client, login_as):
    login_as("admin")
    assert (
        client.patch("/api/users/user", json={"password": "********"}).status_code
        == 200
    )
    login_as("user", "********")


def test_update_user(test_database, client, login_as):
    login_as("admin")

    body = {"email": "noreply@example.ca", "is_admin": True}
    response = client.patch("/api/users/user", json=body)
    assert response.status_code == 200
    for field in body:
        assert response.get_json()[field] == body[field]

    body = {"email": "noreply@sickkids.ca"}
    # TODO: should be 409 or something else in the future
    assert client.patch("/api/users/user", json=body).status_code == 400


def test_update_user_groups(test_database, minio_policy, client, login_as):
    # TODO: This doesn't actually test behaviour with multiple groups
    # TODO: We don't confirm that if `groups` is omitted that they aren't erased
    minio_admin = minio_policy
    minio_admin.add_user("admin", "PresidentBusiness")
    user = User.query.filter_by(username="admin").first()
    user.minio_access_key = "admin"
    user.minio_secret_key = "PresidentBusiness"
    db.session.commit()

    login_as("admin")
    assert client.patch("/api/users/admin", json={"groups": ["dne"]}).status_code == 404

    # Add
    response = client.patch("/api/users/admin", json={"groups": ["ach"]})
    assert response.status_code == 200
    assert response.get_json()["groups"] == ["ach"]
    assert "admin" in minio_admin.get_group("ach").get("members", [])

    # Remove
    response = client.patch("/api/users/admin", json={"groups": []})
    assert response.status_code == 200
    assert response.get_json()["groups"] == []
    assert "admin" not in minio_admin.get_group("ach").get("members", [])
