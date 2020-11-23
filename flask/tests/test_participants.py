import pytest
from app import db, models
from flask import request, jsonify, current_app as app
from sqlalchemy.orm import joinedload
from test_datasets import login_as

import json

# Tests

# GET /api/participants


def test_no_participants(test_database, client):
    assert login_as(client, "admin").status_code == 200

    response = client.get("/api/participants?user=3")
    assert response.status_code == 200
    assert len(response.get_json()) == 0


def test_list_participants_admin(test_database, client):
    assert login_as(client, "admin").status_code == 200

    response = client.get("/api/participants")
    assert response.status_code == 200
    assert len(response.get_json()) == 3


def test_list_participant_user(test_database, client):
    assert login_as(client, "user").status_code == 200

    response = client.get("/api/participants")
    assert response.status_code == 200
    # Check number of participants
    assert len(response.get_json()) == 2
    # Check number of tissue samples per participant
    assert len(response.get_json()[0]["tissue_samples"]) == 1
    assert len(response.get_json()[1]["tissue_samples"]) == 1
    # Check number of datasets per tissue sample in participant
    assert len(response.get_json()[0]["tissue_samples"][0]["datasets"]) == 1
    assert len(response.get_json()[1]["tissue_samples"][0]["datasets"]) == 1

    # Check if they are the right participants
    diclist = response.get_json()
    assert (
        diclist[0]["participant_codename"] == "001"
        and diclist[1]["participant_codename"] == "002"
    ) or (
        diclist[1]["participant_codename"] == "001"
        and diclist[0]["participant_codename"] == "002"
    )

    # Repeat above test from admin's eyes
    assert login_as(client, "admin").status_code == 200

    response = client.get("/api/participants?user=2")
    assert response.status_code == 200
    # Check number of participants
    assert len(response.get_json()) == 2
    # Check number of tissue samples per participant
    assert len(response.get_json()[0]["tissue_samples"]) == 1
    assert len(response.get_json()[1]["tissue_samples"]) == 1
    # Check number of datasets per tissue sample in participant
    assert len(response.get_json()[0]["tissue_samples"][0]["datasets"]) == 1
    assert len(response.get_json()[1]["tissue_samples"][0]["datasets"]) == 1

    # Check if they are the right participants
    diclist = response.get_json()
    assert (
        diclist[0]["participant_codename"] == "001"
        and diclist[1]["participant_codename"] == "002"
    ) or (
        diclist[1]["participant_codename"] == "001"
        and diclist[0]["participant_codename"] == "002"
    )


# DELETE /api/participants/:id

def test_delete_participant(test_database, client):
    # Test without permission, will work when check_admin is implemented
    # assert login_as(client, "user").status_code == 200
    # response = client.delete('/api/participants/1')
    # assert response.status_code == 401

    # Test with wrong id
    assert login_as(client, "admin").status_code == 200
    response = client.delete("/api/participants/4")
    assert response.status_code == 404

    # Test with tissue sample in it
    assert login_as(client, "admin").status_code == 200
    response = client.delete("/api/participants/1")
    assert response.status_code == 422

    # Standard test, need to clear everything below first
    participant = (
        models.Participant.query.filter(models.Participant.participant_id == 1)
        .options(joinedload(models.Participant.tissue_samples).joinedload(models.TissueSample.datasets).joinedload(models.Dataset.analyses))
        .one_or_none()
    )

    for sample in participant.tissue_samples:
        for dataset in sample.datasets:
            for analysis in dataset.analyses:
                db.session.delete(analysis)
            db.session.delete(dataset)
        db.session.delete(sample)

    db.session.commit()

    assert login_as(client, "admin").status_code == 200
    assert client.delete("/api/participants/1").status_code == 204
    # Make sure it's gone
    response2 = client.get("/api/participants")
    assert response2.status_code == 200
    assert len(response2.get_json()) == 2


# PATCH /api/participants/:id

def test_patch_participant(test_database, client):
    assert login_as(client, "user").status_code == 200
    # Test existence
    assert client.patch("/api/participants/4", json={"notes":"blank"}).status_code == 404
    # Test permission
    assert client.patch("/api/participants/3", json={"notes":"blank"}).status_code == 404
    # Test changing invalid field
    assert client.patch("/api/participants/1", json={"participant_type":"not_an_enum"}).status_code == 400
    # Test success
    response = client.patch("/api/participants/1", json={"notes":"blank"})
    assert response.status_code == 200
    # Make sure it updated
    participant = (
        models.Participant.query.filter(models.Participant.participant_id == 1)
        .one_or_none()
    )
    assert participant.notes == "blank"


# POST /api/participants
