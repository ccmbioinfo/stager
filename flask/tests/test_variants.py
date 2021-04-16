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
    assert (
        client.get(
            "api/summary/variants?panel=LOXL4", headers={"Accept": "application/json"}
        ).status_code
        == 200
    )
