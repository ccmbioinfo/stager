import pytest
from app import db, models
from flask import request, jsonify, current_app as app
from sqlalchemy.orm import joinedload
from test_datasets import login_as

# Tests

# GET /api/analyses


def test_no_analyses(test_database, client):
    assert login_as(client, "admin").status_code == 200

    response = client.get("/api/analyses?user=3")
    assert response.status_code == 200
    assert len(response.get_json()) == 0


def test_list_anaylses_admin(test_database, client):
    assert login_as(client, "admin").status_code == 200

    response = client.get("/api/analyses")
    assert response.status_code == 200
    assert len(response.get_json()) == 3


def test_list_analyses_user(test_database, client):
    assert login_as(client, "user").status_code == 200

    response = client.get("/api/analyses")
    assert response.status_code == 200
    # Check number of analyses
    assert len(response.get_json()) == 2


def test_list_analyses_user_from_admin(test_database, client):
    # Repeat above test from admin's eyes
    assert login_as(client, "admin").status_code == 200

    response = client.get("/api/analyses?user=2")
    assert response.status_code == 200
    # Check number of analyses
    assert len(response.get_json()) == 2


# GET /api/analyses/:id


def test_get_analyses(test_database, client):
    # Test invalid analysis_id
    assert login_as(client, "admin").status_code == 200
    assert client.get("/api/analyses/4").status_code == 404
    # Test wrong permissions
    assert client.post("/api/logout", json={"useless": "why"}).status_code == 204
    assert login_as(client, "user").status_code == 200
    assert client.get("/api/analyses/3").status_code == 404

    # Test and validate success based on user's permissions
    assert login_as(client, "user").status_code == 200
    response = client.get("/api/analyses/1")
    assert response.status_code == 200
    # Check number of participants in response
    assert len(response.get_json()["datasets"]) == 1
    assert response.get_json()["datasets"][0]["family_codename"] == "A"

    # Test and validate success based on user's permissions
    assert login_as(client, "user").status_code == 200
    response = client.get("/api/analyses/2")
    assert response.status_code == 200
    # Check number of participants in response
    assert len(response.get_json()["datasets"]) == 2


# DELETE /api/analyses/:id


def test_delete_analysis(test_database, client):
    # Test without permission
    assert login_as(client, "user").status_code == 200
    response = client.delete("/api/analyses/1")
    assert response.status_code == 401
    assert client.post("/api/logout", json={"useless": "why"}).status_code == 204

    # Test with wrong id
    assert login_as(client, "admin").status_code == 200
    response = client.delete("/api/analyses/4")
    assert response.status_code == 404

    # Standard test
    assert login_as(client, "admin").status_code == 200
    assert client.delete("/api/analyses/1").status_code == 204
    # Make sure it's gone
    response2 = client.get("/api/analyses")
    assert response2.status_code == 200
    assert len(response2.get_json()) == 2


# PATCH /api/analyses/:id


def test_patch_participant(test_database, client):
    assert login_as(client, "user").status_code == 200
    # Test existence
    assert (
        client.patch("/api/analyses/4", json={"result_hpf_path": "blank"}).status_code
        == 404
    )
    # Test permission
    assert (
        client.patch("/api/analyses/3", json={"result_hpf_path": "blank"}).status_code
        == 404
    )
    # Test assignee does not exist
    assert client.patch("/api/analyses/1", json={"assignee": "nope"}).status_code == 400
    # Test enum error
    assert (
        client.patch(
            "/api/analyses/1", json={"analysis_state": "not_an_enum"}
        ).status_code
        == 400
    )
    # Test success
    response = client.patch("/api/analyses/1", json={"analysis_state": "Done"})
    assert response.status_code == 200
    # Make sure it updated
    analysis = models.Analysis.query.filter(
        models.Analysis.analysis_id == 1
    ).one_or_none()
    assert analysis.analysis_state == "Done"


# POST /api/analyses


def test_post_analyses(test_database, client):
    assert login_as(client, "user").status_code == 200
    # Test no pipeline id given
    assert (
        client.post(
            "/api/analyses",
            json={"datasets": "haha"},
        ).status_code
        == 400
    )
    # Test no dataset id given
    assert (
        client.post(
            "/api/analyses",
            json={"pipeline_id": "haha"},
        ).status_code
        == 400
    )

    # The following 2 tests have not been implemented yet, please uncomment when they have :)

    # # Test invalid dataset id given
    # assert (
    #     client.post(
    #         "/api/analyses", json={"datasets": "haha", "pipeline_id": 1}
    #     ).status_code
    #     == 400
    # )

    # # Test invalid pipeline id given
    # assert (
    #     client.post(
    #         "/api/analyses", json={"datasets": [1, 2], "pipeline_id": "lol nah"}
    #     ).status_code
    #     == 400
    # )

    # Test success and check db
    assert (
        client.post(
            "/api/analyses", json={"datasets": [1, 2], "pipeline_id": 1}
        ).status_code
        == 200
    )
    analysis = (
        models.Analysis.query.options(joinedload(models.Analysis.datasets))
        .filter(models.Analysis.analysis_id == 4)
        .one_or_none()
    )
    dataset_1 = (
        models.Dataset.query.options(joinedload(models.Dataset.analyses))
        .filter(models.Dataset.dataset_id == 2)
        .one_or_none()
    )
    assert analysis is not None
    assert len(analysis.datasets) == 2
    assert len(dataset_1.analyses) == 3

    assert client.post("/api/logout", json={"useless": "why"}).status_code == 204
    assert login_as(client, "admin").status_code == 200
    assert len(client.get("/api/analyses").get_json()) == 4
