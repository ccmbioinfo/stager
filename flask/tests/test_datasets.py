import pytest
from app import db, models
from sqlalchemy.orm import joinedload

# TODO: some tests do not precisely verify response structure


def test_list_datasets_admin(client, test_database, login_as):
    """
    GET /api/datasets as an administrator
    """
    login_as("admin")

    # Retrieve all datasets as admin
    response = client.get("/api/datasets")
    assert response.status_code == 200
    body = response.get_json()
    assert body["page"] == 0
    assert len(body["data"]) == body["total_count"] == 4

    # Assume user identity belonging to no groups
    response = client.get("/api/datasets?user=1")
    assert response.status_code == 200
    body = response.get_json()
    assert body["page"] == 0
    assert len(body["data"]) == body["total_count"] == 0

    # Assume user identity belonging to a group with limited visibility
    response = client.get("/api/datasets?user=2")
    assert response.status_code == 200
    body = response.get_json()
    assert body["page"] == 0
    assert len(body["data"]) == body["total_count"] == 2

    # Assume nonexistent user identity
    response = client.get("/api/datasets?user=400")
    assert response.status_code == 200
    body = response.get_json()
    assert body["page"] == 0
    assert len(body["data"]) == body["total_count"] == 0


def test_list_datasets_user(client, test_database, login_as):
    """
    GET /api/datasets as a regular user
    """
    login_as("user")

    # Retrieve all datasets I can access
    response = client.get("/api/datasets")
    assert response.status_code == 200
    body = response.get_json()
    assert body["page"] == 0
    assert len(body["data"]) == body["total_count"] == 2

    # Cannot assume another user's identity, query string ignored
    response = client.get("/api/datasets?user=1")
    assert response.status_code == 200
    body = response.get_json()
    assert body["page"] == 0
    assert len(body["data"]) == body["total_count"] == 2

    response = client.get("/api/datasets?user=2")
    assert response.status_code == 200
    body = response.get_json()
    assert body["page"] == 0
    assert len(body["data"]) == body["total_count"] == 2

    response = client.get("/api/datasets?user=400")
    assert response.status_code == 200
    body = response.get_json()
    assert body["page"] == 0
    assert len(body["data"]) == body["total_count"] == 2


def test_get_dataset_admin(client, test_database, login_as):
    """
    GET /api/datasets/:id as an administrator
    """
    login_as("admin")

    # Retrieve all datasets as an admin
    for i in range(1, 5):
        # Retrieve as an admin
        response = client.get(f"/api/datasets/{i}")
        assert response.status_code == 200
        dataset = response.get_json()
        assert dataset["dataset_id"] == i
        assert dataset["condition"] == "Somatic"
        assert dataset["created_by"] == "admin"
        assert dataset["updated_by"] == "admin"

        # Assume user identity belonging to no groups
        assert client.get(f"/api/datasets/{i}?user=1").status_code == 404

        # Assume nonexistent user identity
        assert client.get(f"/api/datasets/{i}?user=400").status_code == 404

    # Assume user identity belonging to a group with limited visibility
    assert client.get(f"/api/datasets/1?user=2").status_code == 200
    assert client.get(f"/api/datasets/2?user=2").status_code == 404
    assert client.get(f"/api/datasets/3?user=2").status_code == 200
    assert client.get(f"/api/datasets/4?user=2").status_code == 404


def test_get_dataset_user(client, test_database, login_as):
    """
    GET /api/datasets/:id as a regular user
    """
    login_as("user")

    # Cannot assume another user's identity, query string ignored
    for query in ["", "?user=1", "?user=2"]:
        assert client.get(f"/api/datasets/1{query}").status_code == 200
        assert client.get(f"/api/datasets/2{query}").status_code == 404
        assert client.get(f"/api/datasets/3{query}").status_code == 200
        assert client.get(f"/api/datasets/4{query}").status_code == 404


def test_update_dataset_admin(client, test_database, login_as):
    """
    PATCH /api/datasets/:id as an administrator
    """
    login_as("admin")

    # Nonexistent
    assert client.patch("/api/datasets/400", json={"foo": "bar"}).status_code == 404
    # Assume user identity that does not have permission
    assert (
        client.patch("/api/datasets/2?user=1", json={"foo": "bar"}).status_code == 404
    )

    # Bad dataset_type
    assert (
        client.patch("/api/datasets/2", json={"dataset_type": "foo"}).status_code == 400
    )

    unaffected = [{"tissue_sample_id": 12}, {"analyses": []}]
    for body in unaffected:
        response = client.patch("/api/datasets/2", json=body)
        assert response.status_code == 200
        dataset = response.get_json()
        for key, value in body.items():
            assert key not in dataset or dataset[key] != value

    changes = [
        {"notes": "stop the count"},
        {"dataset_type": "WES", "linked_files": ["/path/to/file"]},
    ]
    for body in changes:
        response = client.patch("/api/datasets/2", json=body)
        assert response.status_code == 200
        dataset = response.get_json()
        for key, value in body.items():
            assert dataset[key] == value


def test_update_dataset_user(client, test_database, login_as):
    """
    PATCH /api/datasets/:id as a regular user
    """
    login_as("user")

    # Nonexistent
    assert client.patch("/api/datasets/400", json={"foo": "bar"}).status_code == 404
    # No permission
    assert client.patch("/api/datasets/2", json={"foo": "bar"}).status_code == 404

    changes = [
        {"notes": "stop the count"},
        {"dataset_type": "WES", "linked_files": ["/path/to/file"]},
    ]
    for body in changes:
        response = client.patch("/api/datasets/1", json=body)
        assert response.status_code == 200
        dataset = response.get_json()
        assert dataset["updated_by"] == "user"
        for key, value in body.items():
            assert dataset[key] == value


def test_delete_dataset_admin(client, test_database, login_as):
    """
    DELETE /api/datasets/:id as an administrator
    """
    login_as("admin")

    # Deleting a dataset with analyses
    assert client.delete("/api/datasets/1").status_code == 422
    assert client.get("/api/datasets/1").status_code == 200

    dataset = (
        models.Dataset.query.filter(models.Dataset.dataset_id == 1)
        .options(
            joinedload(models.Dataset.analyses)
            .joinedload(models.Analysis.genotype)
            .joinedload(models.Genotype.variant)
        )
        .one_or_none()
    )

    for analysis in dataset.analyses:
        for genotype in analysis.genotype:
            db.session.delete(genotype)
        db.session.commit()
        for variant in analysis.variants:
            db.session.delete(variant)
        db.session.delete(analysis)
    db.session.commit()

    assert client.delete("/api/datasets/1").status_code == 204
    assert client.get("/api/datasets/1").status_code == 404

    # Deleting a nonexistent dataset
    assert client.delete("/api/datasets/400").status_code == 404
    assert client.get("/api/datasets/400").status_code == 404


def test_delete_dataset_user(client, test_database, login_as):
    """
    DELETE /api/datasets/:id as a regular user
    """
    login_as("user")

    # Regular users cannot delete
    assert client.delete("/api/datasets/1").status_code == 401
    assert client.get("/api/datasets/1").status_code == 200

    # Regular users cannot ascertain the existence of datasets by trying to delete
    assert client.delete("/api/datasets/2").status_code == 401
    assert client.get("/api/datasets/2").status_code == 404
    assert client.delete("/api/datasets/400").status_code == 401
    assert client.get("/api/datasets/400").status_code == 404


def test_create_dataset(client, test_database, login_as):
    """
    POST /api/dataset as an administrator
    """
    login_as("admin")

    invalid_requests = [
        {"wait it's all 400 bad request": "always has been"},
        # Missing fields
        {"dataset_type": "foo"},
        {"tissue_sample_id": "foo"},
        {"dataset_type": "WGS", "tissue_sample_id": 1},
        # Bad dataset_type
        {"dataset_type": "foo", "tissue_sample_id": 1},
    ]
    for body in invalid_requests:
        assert client.post("/api/datasets", json=body).status_code == 400

    # Nonexistent tissue sample
    assert (
        client.post(
            "/api/datasets",
            json={
                "dataset_type": "foo",
                "sequencing_date": "2020-12-04",
                "tissue_sample_id": "foo",
            },
        ).status_code
        == 404
    )
    assert (
        client.post(
            "/api/datasets",
            json={
                "dataset_type": "foo",
                "sequencing_date": "2020-12-04",
                "tissue_sample_id": 400,
            },
        ).status_code
        == 404
    )
    # No sequencing date
    assert (
        client.post(
            "/api/datasets", json={"dataset_type": "WGS", "tissue_sample_id": 1}
        ).status_code
        == 400
    )

    # Successful minimal create
    response = client.post(
        "/api/datasets",
        json={
            "dataset_type": "WGS",
            "tissue_sample_id": 1,
            "condition": "Somatic",
            "sequencing_date": "2020-12-04",
        },
    )
    assert response.status_code == 201
    dataset = response.get_json()
    assert dataset["dataset_type"] == "WGS"
    assert dataset["tissue_sample_id"] == 1
    assert dataset["created_by"] == "admin"
    assert dataset["updated_by"] == "admin"
    assert "created" in dataset and "updated" in dataset

    endpoint = f"/api/datasets/{dataset['dataset_id']}"
    assert response.location.endswith(endpoint)
    assert client.get(endpoint).status_code == 200


def test_unauthenticated(client, test_database):
    """
    Try to access all /api/datasets without signing in
    """
    unauthorized = [
        client.get("/api/datasets"),
        client.post("/api/datasets"),
        client.get("/api/datasets/1"),
        client.get("/api/datasets/400"),  # does not exist
        client.patch("/api/datasets/1"),
        client.patch("/api/datasets/400"),  # does not exist
        client.delete("/api/datasets/1"),
        client.delete("/api/datasets/400"),  # does not exist
    ]
    not_found = [
        client.get("/api/datasets/foo"),
        client.patch("/api/datasets/foo"),
        client.post("/api/datasets/foo"),
        client.put("/api/datasets/foo"),
        client.delete("/api/datasets/foo"),
    ]
    method_not_allowed = [
        client.put("/api/datasets"),
        client.patch("/api/datasets"),
        client.delete("/api/datasets"),
        client.post("/api/datasets/1"),
        client.post("/api/datasets/400"),
        client.put("/api/datasets/1"),
        client.put("/api/datasets/400"),
    ]
    for response in unauthorized:
        assert response.status_code == 401
    for response in not_found:
        assert response.status_code == 404
    for response in method_not_allowed:
        assert response.status_code == 405
