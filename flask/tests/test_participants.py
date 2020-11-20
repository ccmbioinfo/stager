import pytest
from app import db, models
from flask import request, jsonify, current_app as app

import json

def login_as(client, identity):
    return client.post(
        "/api/login",
        json={"username": identity, "password": identity},
        follow_redirects=True,
    )

# Tests

# GET /api/participants

def test_no_participants(test_database, client):
    assert login_as(client, "admin").status_code == 200

    response = client.get('/api/participants?user=3')
    assert response.status_code == 200
    assert len(response.get_json()) == 0

def test_list_participants_admin(test_database, client):
    assert login_as(client, "admin").status_code == 200

    response = client.get('/api/participants')
    assert response.status_code == 200
    assert len(response.get_json()) == 3

def test_list_participant_user(test_database, client):
    assert login_as(client, "user").status_code == 200

    response = client.get('/api/participants')
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
    assert (diclist[0]["participant_codename"] == "001" and diclist[1]["participant_codename"] == "002") or (diclist[1]["participant_codename"] == "001" and diclist[0]["participant_codename"] == "002")


    # Repeat above test from admin's eyes
    assert login_as(client, "admin").status_code == 200

    response = client.get('/api/participants?user=2')
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
    assert (diclist[0]["participant_codename"] == "001" and diclist[1]["participant_codename"] == "002") or (diclist[1]["participant_codename"] == "001" and diclist[0]["participant_codename"] == "002")



# DELETE /api/participants/:id



# PATCH /api/participants/:id
