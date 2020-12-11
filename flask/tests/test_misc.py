import pytest
from app import db, models
from sqlalchemy.orm import joinedload

# GET /api/pipelines


def test_get_pipelines(test_database, client, login_as):
    # Not much to test here, if the endpoint is updated please add more tests
    # Test success
    login_as("admin")
    response = client.get("/api/pipelines")
    assert response.status_code == 200
    assert len(response.get_json()) == 1


# GET /api/enums


def test_get_enums(test_database, client, login_as):
    # Test success
    login_as("admin")
    response = client.get("/api/enums")
    assert response.status_code == 200
    assert len(response.get_json()) == 10
    for enumType, enums in response.get_json().items():
        assert enumType is not None


# POST /api/_bulk


def test_post_bulk(test_database, client, login_as):
    login_as("admin")
    # Test invalid csv
    badsamplecsv = open("tests/badsamplecsv.csv", "r")
    assert (
        client.post(
            "/api/_bulk",
            data=badsamplecsv.read(),
            headers={"Content-Type": "text/csv"},
        ).status_code
        == 400
    )
    # Test not json array
    assert (
        client.post(
            "/api/_bulk",
            json={
                "family_codename": "1001",
                "participant_codename": "06332",
                "tissue_sample": "Blood",
                "tissue_sample_type": "Blood",
                "dataset_type": "WGS",
                "condition": "GermLine",
                "gender": "Male",
                "participant_type": "Parent",
            },
        ).status_code
        == 422
    )

    # Test enum error
    assert (
        client.post(
            "/api/_bulk",
            json=[
                {
                    "family_codename": "1001",
                    "participant_codename": "ANYTHING ELSE",
                    "tissue_sample": "Blood",
                    "tissue_sample_type": "DEFINITELY NOT AN ENUM",
                    "dataset_type": "WGS",
                    "condition": "GermLine",
                    "gender": "Male",
                    "participant_type": "Parent",
                }
            ],
        ).status_code
        == 400
    )

    # Test json array
    assert (
        client.post(
            "/api/_bulk",
            json=[
                {
                    "family_codename": "1001",
                    "participant_codename": "1411",
                    "tissue_sample": "Blood",
                    "tissue_sample_type": "Blood",
                    "dataset_type": "WGS",
                    "condition": "GermLine",
                },
                {
                    "family_codename": "1001",
                    "participant_codename": "3420",
                    "tissue_sample": "Blood",
                    "tissue_sample_type": "Blood",
                    "dataset_type": "WES",
                    "condition": "GermLine",
                },
            ],
        ).status_code
        == 200
    )
    # Test csv
    goodcsv = open("tests/samplecsv.csv", "r")
    assert (
        client.post(
            "/api/_bulk",
            data=goodcsv.read(),
            headers={"Content-Type": "text/csv"},
        ).status_code
        == 200
    )

    # Check db for both csv result and json array result

    family = (
        models.Family.query.options(joinedload(models.Family.participants))
        .filter(models.Family.family_codename == "1001")
        .one_or_none()
    )
    assert family is not None
    assert len(family.participants) == 2

    # part = (
    #     models.Participant.query
    #     .filter(models.Participant.participant_codename == "06332")
    #     .one_or_none()
    # )
    # assert part.created is None

    family = (
        models.Family.query.options(joinedload(models.Family.participants))
        .filter(models.Family.family_codename == "FAM01")
        .one_or_none()
    )
    assert family is not None
    assert len(family.participants) == 3

    random_participant = (
        models.Participant.query.options(
            joinedload(models.Participant.tissue_samples).joinedload(
                models.TissueSample.datasets
            )
        )
        .filter(models.Participant.participant_codename == "PTP02")
        .one_or_none()
    )
    assert random_participant is not None
    assert len(random_participant.tissue_samples) == 1
    assert len(random_participant.tissue_samples[0].datasets) == 1


def test_bulk_multiple_csv(test_database, client, login_as):
    login_as("admin")

    assert (
        client.post(
            "/api/_bulk",
            data="""
family_codename,participant_codename,participant_type,tissue_sample_type,dataset_type,sex,condition,linked_files,notes
HOOD,HERO,Proband,Saliva,WGS,Female,GermLine,/path/foo|/path/bar||,
HOOD,HERO,Proband,Saliva,WGS,Female,GermLine,/path/yeet|/path/cross|/foo/bar,three
""",
            headers={"Content-Type": "text/csv"},
        ).status_code
        == 200
    )

    for dataset in models.Dataset.query.all():
        print(dataset)
    assert models.Dataset.query.count() == 6
    assert models.DatasetFile.query.count() == 5
    assert models.TissueSample.query.count() == 5
    assert models.Participant.query.count() == 4
    assert models.Family.query.count() == 3


def test_bulk_multiple_json(test_database, client, login_as):
    login_as("admin")

    assert (
        client.post(
            "/api/_bulk",
            json=[
                {
                    "family_codename": "HOOD",
                    "participant_codename": "HERO",
                    "participant_type": "Proband",
                    "tissue_sample_type": "Saliva",
                    "dataset_type": "WGS",
                    "sex": "Female",
                    "condition": "GermLine",
                    "linked_files": ["/otonashi/yuzuru", "/tachibana/kanade"],
                },
                {
                    "family_codename": "HOOD",
                    "participant_codename": "HERO",
                    "participant_type": "Proband",
                    "tissue_sample_type": "Saliva",
                    "dataset_type": "WES",
                    "sex": "Female",
                    "condition": "GermLine",
                    "linked_files": [
                        "",
                        "/perfectly/balanced",
                        "/as/all/things/should/be",
                    ],
                },
            ],
        ).status_code
        == 200
    )

    assert models.Dataset.query.count() == 6
    assert models.DatasetFile.query.count() == 4
    assert models.TissueSample.query.count() == 5
    assert models.Participant.query.count() == 4
    assert models.Family.query.count() == 3
