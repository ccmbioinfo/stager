import pytest
from app import db, models
from sqlalchemy.orm import joinedload

# Tests

# GET /api/participants


def test_no_participants(test_database, client, login_as):
    login_as("admin")

    response = client.get("/api/participants?user=4")
    assert response.status_code == 200
    assert len(response.get_json()["data"]) == 0
    assert response.get_json()["total_count"] == 0


def test_list_participants_admin(test_database, client, login_as):
    login_as("admin")

    response = client.get("/api/participants")
    assert response.status_code == 200
    assert len(response.get_json()["data"]) == 3
    assert response.get_json()["total_count"] == 3


def test_list_participants_user(test_database, client, login_as):
    login_as("user")

    response = client.get("/api/participants")
    assert response.status_code == 200
    # Check number of participants
    assert len(response.get_json()["data"]) == 2
    assert response.get_json()["total_count"] == 2
    # Check number of tissue samples per participant
    assert len(response.get_json()["data"][0]["tissue_samples"]) == 1
    assert len(response.get_json()["data"][1]["tissue_samples"]) == 1
    # Check number of datasets per tissue sample in participant
    assert len(response.get_json()["data"][0]["tissue_samples"][0]["datasets"]) == 1
    assert len(response.get_json()["data"][1]["tissue_samples"][0]["datasets"]) == 1

    # Check if they are the right participants
    diclist = response.get_json()["data"]
    assert (
        diclist[0]["participant_codename"] == "001"
        and diclist[1]["participant_codename"] == "002"
    ) or (
        diclist[1]["participant_codename"] == "001"
        and diclist[0]["participant_codename"] == "002"
    )


def test_list_participants_user_from_admin(test_database, client, login_as):
    # Repeat above test from admin's eyes
    login_as("admin")

    response = client.get("/api/participants?user=2")
    assert response.status_code == 200
    # Check number of participants
    assert len(response.get_json()["data"]) == 2
    assert response.get_json()["total_count"] == 2
    # Check number of tissue samples per participant
    assert len(response.get_json()["data"][0]["tissue_samples"]) == 1
    assert len(response.get_json()["data"][1]["tissue_samples"]) == 1
    # Check number of datasets per tissue sample in participant
    assert len(response.get_json()["data"][0]["tissue_samples"][0]["datasets"]) == 1
    assert len(response.get_json()["data"][1]["tissue_samples"][0]["datasets"]) == 1

    # Check if they are the right participants
    diclist = response.get_json()["data"]
    assert (
        diclist[0]["participant_codename"] == "001"
        and diclist[1]["participant_codename"] == "002"
    ) or (
        diclist[1]["participant_codename"] == "001"
        and diclist[0]["participant_codename"] == "002"
    )


# DELETE /api/participants/:id


def test_delete_participant(test_database, client, login_as):
    # Test without permission
    login_as("user")
    response = client.delete("/api/participants/1")
    assert response.status_code == 401

    # Test with wrong id
    login_as("admin")
    response = client.delete("/api/participants/4")
    assert response.status_code == 404

    # Test with tissue sample in it
    login_as("admin")
    response = client.delete("/api/participants/1")
    assert response.status_code == 422

    # Standard test, need to clear everything below first
    participant = (
        models.Participant.query.filter(models.Participant.participant_id == 1)
        .options(
            joinedload(models.Participant.tissue_samples)
            .joinedload(models.TissueSample.datasets)
            .joinedload(models.Dataset.analyses)
            .joinedload(models.Analysis.genotype)
            .joinedload(models.Genotype.variant)
        )
        .one_or_none()
    )

    for sample in participant.tissue_samples:
        for dataset in sample.datasets:
            for analysis in dataset.analyses:
                for genotype in analysis.genotype:
                    db.session.delete(genotype)
                db.session.commit()
                for variant in analysis.variants:
                    db.session.delete(variant)
                db.session.delete(analysis)
            db.session.delete(dataset)
        db.session.delete(sample)

    db.session.commit()

    login_as("admin")
    assert client.delete("/api/participants/1").status_code == 204
    # Make sure it's gone
    response2 = client.get("/api/participants")
    assert response2.status_code == 200
    assert len(response2.get_json()["data"]) == 2
    assert response2.get_json()["total_count"] == 2


# PATCH /api/participants/:id


def test_update_participant(test_database, client, login_as):
    login_as("user")
    # Test existence
    assert (
        client.patch("/api/participants/4", json={"notes": "blank"}).status_code == 404
    )
    # Test permission
    assert (
        client.patch("/api/participants/3", json={"notes": "blank"}).status_code == 404
    )
    # Test enum error
    assert (
        client.patch(
            "/api/participants/1", json={"participant_type": "not_an_enum"}
        ).status_code
        == 400
    )
    # Test success
    response = client.patch("/api/participants/1", json={"notes": "blank"})
    assert response.status_code == 200
    # Make sure it updated
    participant = models.Participant.query.filter(
        models.Participant.participant_id == 1
    ).one_or_none()
    assert participant.notes == "blank"


# POST /api/participants


def test_create_participant(test_database, client, login_as):
    login_as("user")
    assert client.post("/api/participants").status_code == 401

    login_as("admin")
    # Test family does not exist
    assert client.post("/api/participants", json={"family_id": "3"}).status_code == 404
    # Test if participant in family already exists
    assert (
        client.post(
            "/api/participants", json={"family_id": "1", "participant_codename": "001"}
        ).status_code
        == 422
    )
    # Test enum error
    assert (
        client.post(
            "/api/participants",
            json={
                "family_id": "1",
                "participant_codename": "003",
                "participant_type": "not_an_enum",
            },
        ).status_code
        == 400
    )
    # Test success and check db
    assert (
        client.post(
            "/api/participants",
            json={
                "family_id": "1",
                "participant_codename": "004",
                "participant_type": "Parent",
                "sex": "Female",
                "notes": "nothing",
            },
        ).status_code
        == 201
    )
    participant = models.Participant.query.filter(
        models.Participant.family_id == 1,
        models.Participant.participant_codename == "004",
    ).one_or_none()
    assert participant.notes == "nothing"
    assert participant.created_by_id == 1
