import pytest
from app import db, models
from sqlalchemy.orm import joinedload

# Tests

# GET /api/families


def test_no_families(test_database, client, login_as):
    login_as("admin")

    response = client.get("/api/families?user=3")
    assert response.status_code == 200
    assert len(response.get_json()) == 0


def test_list_families_admin(test_database, client, login_as):
    login_as("admin")

    response = client.get("/api/families")
    assert response.status_code == 200
    assert len(response.get_json()) == 2


def test_list_families_user(test_database, client, login_as):
    login_as("user")

    response = client.get("/api/families")
    assert response.status_code == 200
    # Check number of families
    assert len(response.get_json()) == 1
    # Check number of participants per family
    assert len(response.get_json()[0]["participants"]) == 2

    # Check if it is the correct family
    assert response.get_json()[0]["family_codename"] == "A"


def test_list_families_user_from_admin(test_database, client, login_as):
    # Repeat above test from admin's eyes
    login_as("admin")

    response = client.get("/api/families?user=2")
    assert response.status_code == 200
    # Check number of families
    assert len(response.get_json()) == 1
    # Check number of participants per family
    assert len(response.get_json()[0]["participants"]) == 2

    # Check if it is the correct family
    assert response.get_json()[0]["family_codename"] == "A"


# GET /api/families/:id


def test_get_family(test_database, client, login_as):
    # Test invalid family id
    login_as("admin")
    assert client.get("/api/families/3").status_code == 404
    # Test wrong permissions
    assert client.post("/api/logout", json={"useless": "why"}).status_code == 204
    login_as("user")
    assert client.get("/api/families/2").status_code == 404

    # Test and validate success based on user's permissions
    login_as("user")
    response = client.get("/api/families/1")
    assert response.status_code == 200
    # Check number of participants in response
    assert len(response.get_json()[0]["participants"]) == 2
    # Check number of tissue samples in response
    assert (
        len(response.get_json()[0]["participants"][0]["tissue_samples"]) == 1
        and len(response.get_json()[0]["participants"][1]["tissue_samples"]) == 1
    )
    # Check number of datasets in response
    assert (
        len(response.get_json()[0]["participants"][0]["tissue_samples"][0]["datasets"])
        == 1
        and len(
            response.get_json()[0]["participants"][1]["tissue_samples"][0]["datasets"]
        )
        == 1
    )


# DELETE /api/families/:id


def test_delete_family(test_database, client, login_as):
    # Test without permission
    login_as("user")
    response = client.delete("/api/families/1")
    assert response.status_code == 401
    assert client.post("/api/logout", json={"useless": "why"}).status_code == 204

    # Test with wrong id
    login_as("admin")
    response = client.delete("/api/families/3")
    assert response.status_code == 404

    # Test with participant in it
    login_as("admin")
    response = client.delete("/api/families/2")
    assert response.status_code == 422

    # Standard test, need to clear everything below first
    fam = (
        models.Family.query.filter(models.Family.family_id == 1)
        .options(
            joinedload(models.Family.participants)
            .joinedload(models.Participant.tissue_samples)
            .joinedload(models.TissueSample.datasets)
            .joinedload(models.Dataset.analyses)
        )
        .one_or_none()
    )
    for participant in fam.participants:
        for sample in participant.tissue_samples:
            for dataset in sample.datasets:
                for analysis in dataset.analyses:
                    db.session.delete(analysis)
                db.session.delete(dataset)
            db.session.delete(sample)
        db.session.delete(participant)

    db.session.commit()

    login_as("admin")
    assert client.delete("/api/families/1").status_code == 204
    # Make sure it's gone
    response2 = client.get("/api/families")
    assert response2.status_code == 200
    assert len(response2.get_json()) == 1


# PATCH /api/families/:id


def test_update_family(test_database, client, login_as):
    login_as("user")
    # Test existence
    assert (
        client.patch("/api/families/4", json={"family_codename": "C"}).status_code
        == 404
    )

    # Test permission
    assert (
        client.patch("/api/families/2", json={"family_codename": "C"}).status_code
        == 404
    )

    # Test no codename error
    assert (
        client.patch(
            "/api/families/2",
            json={"Haha you thought it was a codename": "but it was I, useless json"},
        ).status_code
        == 400
    )

    # Test success
    assert (
        client.patch("/api/families/1", json={"family_codename": "C"}).status_code
        == 200
    )
    # Make sure it updated
    family = models.Family.query.filter(models.Family.family_id == 1).one_or_none()
    assert family.family_codename == "C"


# POST /api/families


def test_create_family(test_database, client, login_as):
    login_as("user")
    # Test no codename given
    assert (
        client.post(
            "/api/families",
            json={"Haha you thought it was a codename": "but it was I, useless json"},
        ).status_code
        == 400
    )
    # Test codename already in use
    assert (
        client.post(
            "/api/families",
            json={"family_codename": "A"},
        ).status_code
        == 422
    )
    # Test success and check db
    assert (
        client.post(
            "/api/families",
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
    assert client.post("/api/logout", json={"useless": "why"}).status_code == 204
    login_as("admin")
    assert len(client.get("/api/families").get_json()) == 3
