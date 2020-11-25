import pytest
from app import db, models
from flask import request, jsonify, current_app as app
from sqlalchemy.orm import joinedload
from test_datasets import login_as


# GET /api/tissue_samples/:id


def test_get_tissue_samples(test_database, client):
    # Test invalid sample id
    assert login_as(client, "admin").status_code == 200
    assert client.get("/api/tissue_samples/4").status_code == 404
    # Test wrong permissions
    assert client.post("/api/logout", json={"useless": "why"}).status_code == 204
    assert login_as(client, "user").status_code == 200
    assert client.get("/api/tissue_samples/3").status_code == 404

    # Test and validate success based on user's permissions
    assert login_as(client, "user").status_code == 200
    response = client.get("/api/tissue_samples/1")
    assert response.status_code == 200
    # Check number of datasets in response
    assert len(response.get_json()["datasets"]) == 1


# DELETE /api/tissue_samples/:id


def test_delete_tissue_samples(test_database, client):
    # Test without permission
    assert login_as(client, "user").status_code == 200
    response = client.delete("/api/tissue_samples/1")
    assert response.status_code == 401
    assert client.post("/api/logout", json={"useless": "why"}).status_code == 204

    # Test with wrong id
    assert login_as(client, "admin").status_code == 200
    response = client.delete("/api/tissue_samples/4")
    assert response.status_code == 404

    # Test with dataset in it
    assert login_as(client, "admin").status_code == 200
    response = client.delete("/api/tissue_samples/1")
    assert response.status_code == 422

    # Standard test, need to clear everything below first
    sample = (
        models.TissueSample.query.filter(models.TissueSample.tissue_sample_id == 1)
        .options(
            joinedload(models.TissueSample.datasets).joinedload(models.Dataset.analyses)
        )
        .one_or_none()
    )
    for dataset in sample.datasets:
        for analysis in dataset.analyses:
            db.session.delete(analysis)
        db.session.delete(dataset)

    db.session.commit()

    assert login_as(client, "admin").status_code == 200
    assert client.delete("/api/tissue_samples/1").status_code == 204
    # Make sure it's gone
    sample = models.TissueSample.query.filter(
        models.TissueSample.tissue_sample_id == 1
    ).one_or_none()
    assert sample is None


# POST /api/tissue_samples


def test_post_tissue_samples(test_database, client):
    # Test without permission
    assert login_as(client, "user").status_code == 200
    response = client.post("/api/tissue_samples")
    assert response.status_code == 401
    assert client.post("/api/logout", json={"useless": "why"}).status_code == 204

    assert login_as(client, "admin").status_code == 200
    # Test no tissue_sample_type given
    assert (
        client.post(
            "/api/tissue_samples",
            json={"participant_id": "1"},
        ).status_code
        == 400
    )
    # Test no participant_id given
    assert (
        client.post(
            "/api/tissue_samples",
            json={"tissue_sample_type": "Blood"},
        ).status_code
        == 400
    )
    # Test invalid participant id given
    assert (
        client.post(
            "/api/tissue_samples",
            json={
                "tissue_sample_type": "Blood",
                "participant_id": "nope",
            },
        ).status_code
        == 404
    )
    # Test enum error
    assert (
        client.post(
            "/api/tissue_samples",
            json={
                "tissue_sample_type": "not even close to an enum",
                "participant_id": "1",
            },
        ).status_code
        == 400
    )

    # Test success and check db
    assert (
        client.post(
            "/api/tissue_samples",
            json={
                "tissue_sample_type": "Blood",
                "participant_id": "1",
                "notes": "nothing really",
            },
        ).status_code
        == 201
    )
    sample = (
        models.TissueSample.query.options(joinedload(models.TissueSample.datasets))
        .filter(models.TissueSample.notes == "nothing really")
        .one_or_none()
    )
    assert sample is not None
    assert sample.participant_id == 1
    assert len(sample.datasets) == 0
    assert sample.created_by == 1
    assert sample.updated_by == 1
