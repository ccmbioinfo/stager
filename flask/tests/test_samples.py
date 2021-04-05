import pytest
from app import db, models
from sqlalchemy.orm import joinedload


# GET /api/tissue_samples/:id


def test_get_tissue_sample(test_database, client, login_as):
    # Test invalid sample id
    login_as("admin")
    assert client.get("/api/tissue_samples/4").status_code == 404
    # Test wrong permissions
    login_as("user")
    assert client.get("/api/tissue_samples/3").status_code == 404

    # Test and validate success based on user's permissions
    login_as("user")
    response = client.get("/api/tissue_samples/1")
    assert response.status_code == 200
    # Check number of datasets in response
    assert len(response.get_json()["datasets"]) == 1


# DELETE /api/tissue_samples/:id


def test_delete_tissue_sample(test_database, client, login_as):
    # Test without permission
    login_as("user")
    response = client.delete("/api/tissue_samples/1")
    assert response.status_code == 401

    # Test with wrong id
    login_as("admin")
    response = client.delete("/api/tissue_samples/4")
    assert response.status_code == 404

    # Test with dataset in it
    login_as("admin")
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

    login_as("admin")
    assert client.delete("/api/tissue_samples/1").status_code == 204
    # Make sure it's gone
    sample = models.TissueSample.query.filter(
        models.TissueSample.tissue_sample_id == 1
    ).one_or_none()
    assert sample is None


# POST /api/tissue_samples


def test_create_tissue_sample(test_database, client, login_as):
    # Test without permission
    login_as("user")
    response = client.post("/api/tissue_samples")
    assert response.status_code == 401

    login_as("admin")
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
    assert sample.created_by_id == 1
    assert sample.updated_by_id == 1


# PATCH /api/tissue_samples


def test_update_tissue_sample_admin(client, test_database, login_as):
    """
    PATCH /api/datasets/:id as an administrator
    """
    login_as("admin")

    # Nonexistent
    assert (
        client.patch("/api/tissue_samples/400", json={"foo": "bar"}).status_code
        == 404
    )
    # Assume user identity that does not have permission
    assert (
        client.patch(
            "/api/tissue_samples/2?user=1", json={"foo": "bar"}
        ).status_code
        == 404
    )

    # Bad tissue_sample_type
    assert (
        client.patch(
            "/api/tissue_samples/2", json={"tissue_sample_type": "foo"}
        ).status_code
        == 400
    )

    # test that non-editable columns do not change tissue_sample
    unaffected = [{"particpant_id": 12}, {"datasets": []}]
    for body in unaffected:
        response = client.patch("/api/tissue_samples/2", json=body)
        assert response.status_code == 200
        tissue_sample = response.get_json()
        for key, value in body.items():
            assert key not in tissue_sample or tissue_sample[key] != value

    changes = [
        {"notes": "stop the count"},
        {"tissue_sample_type": "Saliva", "notes": "hello"},
    ]
    for body in changes:
        response = client.patch("/api/tissue_samples/2", json=body)
        assert response.status_code == 200
        tissue_sample = response.get_json()
        for key, value in body.items():
            assert tissue_sample[key] == value


def test_update_tissue_sample_user(client, test_database, login_as):
    """
    PATCH /api/tissue_samples/:id as a regular user
    """
    login_as("user")

    # Nonexistent
    assert (
        client.patch("/api/tissue_samples/400", json={"foo": "bar"}).status_code
        == 404
    )
    # No permission
    assert (
        client.patch("/api/tissue_samples/3", json={"foo": "bar"}).status_code
        == 404
    )

    # test that patch request is implemented
    changes = [
        {"notes": "stop the count"},
        {"tissue_sample_type": "Saliva", "notes": "hello"},
    ]
    for body in changes:
        response = client.patch("/api/tissue_samples/1", json=body)
        assert response.status_code == 200
        tissue_sample = response.get_json()
        assert tissue_sample["updated_by"] == "user"
        for key, value in body.items():
            assert tissue_sample[key] == value
