import pytest
from app import db, models
import pandas as pd
from io import BytesIO


def test_get_variant_summary(test_database, client, login_as):

    login_as("admin")

    # single gene
    response = client.get(
        "api/summary/variants?panel=LOXL4",
        headers={"Accept": "application/json"},
    )
    assert response.status_code == 200
    assert len(response.get_json()) == 1
    assert len(response.get_json()[0].get("variants")) == 3

    # multiple genes
    response = client.get(
        "api/summary/variants?panel=LOXL4;RTEL1",
        headers={"Accept": "application/json"},
    )
    assert response.status_code == 200
    # # of genes
    assert len(response.get_json()) == 2
    # # of variants/gene
    for gene in response.get_json():
        assert len(gene.get("variants")) == 3

    # invalid - no gene found
    response = client.get(
        "api/summary/variants?panel=BADGENENAME",
        headers={"Accept": "application/json"},
    )
    assert response.status_code == 400

    # not all genes found

    response = client.get(
        "api/summary/variants?panel=LOXL4;TYPODGENENAME",
        headers={"Accept": "application/json"},
    )
    assert response.status_code == 400

    # --- csv ----
    response = client.get(
        "api/summary/variants?panel=LOXL4", headers={"Accept": "text/csv"}
    )

    df = pd.read_csv(BytesIO(response.get_data()), encoding="utf8")

    assert df.shape[0] == 3

    response = client.get(
        "api/summary/variants?panel=LOXL4;RTEL1", headers={"Accept": "text/csv"}
    )

    df = pd.read_csv(BytesIO(response.get_data()), encoding="utf8")

    assert df.shape[0] == 6

    # --- invalid accept header ----

    response = client.get(
        "api/summary/variants?panel=LOXL4",
        headers={"Accept": "BAD_ACCEPT/HEADER"},
    )
    assert response.status_code == 406

    login_as("user")
    response = client.get(
        "api/summary/variants?panel=LOXL4", headers={"Accept": "application/json"}
    )
    assert response.status_code == 200
    assert len(response.get_json()) == 1


def test_get_participant_summary(test_database, client, login_as):

    login_as("admin")

    # single gene
    response = client.get(
        "api/summary/participants?panel=LOXL4",
        headers={"Accept": "application/json"},
    )

    assert response.status_code == 200
    # of participants
    assert len(response.get_json()) == 2
    # of variants for LOXL4 for each participant's dataset
    for ptp in response.get_json():
        for dataset in ptp.get("dataset"):
            variants = dataset.get("variants")
            assert len(variants) == 3

    # multiple genes
    response = client.get(
        "api/summary/participants?panel=LOXL4;RTEL1",
        headers={"Accept": "application/json"},
    )
    assert response.status_code == 200
    # # of participants
    assert len(response.get_json()) == 2
    # of variants for LOXL4 and RTEL1, for each participant's dataset
    for ptp in response.get_json():
        for dataset in ptp.get("dataset"):
            variants = dataset.get("variants")
            assert len(variants) == 6

    # invalid - no gene found
    response = client.get(
        "api/summary/participants?panel=BADGENENAME",
        headers={"Accept": "application/json"},
    )
    assert response.status_code == 400

    # not all genes found

    response = client.get(
        "api/summary/participants?panel=LOXL4;TYPODGENENAME",
        headers={"Accept": "application/json"},
    )
    assert response.status_code == 400

    # --- csv ----
    response = client.get(
        "api/summary/participants?panel=LOXL4", headers={"Accept": "text/csv"}
    )

    df = pd.read_csv(BytesIO(response.get_data()), encoding="utf8")
    # the number of variants for the given participants in LOXL4 that have sufficient depth for zygosity (5)
    assert df.shape[0] == 5

    response = client.get(
        "api/summary/participants?panel=LOXL4;RTEL1", headers={"Accept": "text/csv"}
    )
    # the number of variants for the given participants in LOXL4 AND RTEL1 that have sufficient depth for zygosity (4 + 5)
    df = pd.read_csv(BytesIO(response.get_data()), encoding="utf8")

    assert df.shape[0] == 9

    # --- invalid accept header ----

    response = client.get(
        "api/summary/participants?panel=LOXL4",
        headers={"Accept": "BAD_ACCEPT/HEADER"},
    )
    assert response.status_code == 406

    login_as("user")
    response = client.get(
        "api/summary/participants?panel=LOXL4",
        headers={"Accept": "application/json"},
    )
    assert response.status_code == 200
    assert len(response.get_json()) == 2
