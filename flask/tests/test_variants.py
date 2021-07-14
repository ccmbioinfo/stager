from io import BytesIO
import pandas as pd


def test_variant_wise_json_single_gene(test_database, client, login_as):
    login_as("admin")
    response = client.get(
        "/api/summary/variants?genes=ENSG00000138131",  # LOXL4
        headers={"Accept": "application/json"},
    )
    assert response.status_code == 200
    assert len(response.get_json()) == 3  # variants


def test_variant_wise_json_multiple_genes(test_database, client, login_as):
    login_as("admin")
    response = client.get(
        "/api/summary/variants?genes=ENSG00000138131,ENSG00000258366",  # LOXL4, RTEL1
        headers={"Accept": "application/json"},
    )
    assert response.status_code == 200
    assert len(response.get_json()) == 6  # variants across the two genes


def test_variant_wise_json_invalid_gene(test_database, client, login_as):
    login_as("admin")
    response = client.get(
        "/api/summary/variants?genes=BADGENENAME",
        headers={"Accept": "application/json"},
    )
    assert response.status_code == 400


def test_variant_wise_json_gene_not_found(test_database, client, login_as):
    login_as("admin")
    response = client.get(
        "/api/summary/variants?genes=ENSG00000138131,ENSG0",
        headers={"Accept": "application/json"},
    )
    assert response.status_code == 400


def test_variant_wise_csv_single_gene(test_database, client, login_as):
    login_as("admin")
    response = client.get(
        "/api/summary/variants?genes=ENSG00000138131", headers={"Accept": "text/csv"}
    )
    df = pd.read_csv(BytesIO(response.get_data()), encoding="utf8")
    assert df.shape[0] == 3


def test_variant_wise_csv_multiple_genes(test_database, client, login_as):
    login_as("admin")
    response = client.get(
        "/api/summary/variants?genes=ENSG00000138131,ENSG00000258366",
        headers={"Accept": "text/csv"},
    )
    df = pd.read_csv(BytesIO(response.get_data()), encoding="utf8")
    assert df.shape[0] == 6


def test_variant_wise_invalid_accept(test_database, client, login_as):
    login_as("admin")
    response = client.get(
        "/api/summary/variants?genes=ENSG00000138131",
        headers={"Accept": "BAD_ACCEPT/HEADER"},
    )
    assert response.status_code == 406


def test_variant_wise_json_permissions(test_database, client, login_as):
    login_as("user")
    response = client.get(
        "/api/summary/variants?genes=ENSG00000138131",
        headers={"Accept": "application/json"},
    )
    assert response.status_code == 200
    assert len(response.get_json()) == 3


def test_participant_wise_json_single_gene(test_database, client, login_as):
    login_as("admin")
    response = client.get(
        "/api/summary/participants?genes=ENSG00000138131",
        headers={"Accept": "application/json"},
    )
    assert response.status_code == 200
    # num. of participant-variants (1x6)
    assert len(response.get_json()) == 6
    # remove nested structure


def test_participant_wise_json_multiple_genes(test_database, client, login_as):
    login_as("admin")
    response = client.get(
        "/api/summary/participants?genes=ENSG00000138131,ENSG00000258366",
        headers={"Accept": "application/json"},
    )
    assert response.status_code == 200
    # num. of participant-variants (2x6)
    assert len(response.get_json()) == 12


def test_participant_wise_json_invalid_gene(test_database, client, login_as):
    login_as("admin")
    response = client.get(
        "/api/summary/participants?genes=BADGENENAME",
        headers={"Accept": "application/json"},
    )
    assert response.status_code == 400


def test_participant_wise_json_gene_not_found(test_database, client, login_as):
    login_as("admin")
    response = client.get(
        "/api/summary/participants?genes=ENSG00000138131,HGNC:0000",
        headers={"Accept": "application/json"},
    )
    assert response.status_code == 400


def test_participant_wise_csv_single_gene(test_database, client, login_as):
    login_as("admin")
    response = client.get(
        "/api/summary/participants?genes=ENSG00000138131",
        headers={"Accept": "text/csv"},
    )
    df = pd.read_csv(BytesIO(response.get_data()), encoding="utf8")
    # the number of variants for the given participants in LOXL4 that have sufficient depth for zygosity (5)
    assert df.shape[0] == 5


def test_participant_wise_csv_multiple_genes(test_database, client, login_as):
    login_as("admin")
    response = client.get(
        "/api/summary/participants?genes=ENSG00000138131,ENSG00000258366",
        headers={"Accept": "text/csv"},
    )
    # the number of variants for the given participants in LOXL4 AND RTEL1 that have sufficient depth for zygosity (4 + 5)
    df = pd.read_csv(BytesIO(response.get_data()), encoding="utf8")
    assert df.shape[0] == 9


def test_participant_wise_invalid_accept(test_database, client, login_as):
    login_as("admin")
    response = client.get(
        "/api/summary/participants?genes=ENSG00000138131",
        headers={"Accept": "BAD_ACCEPT/HEADER"},
    )
    assert response.status_code == 406


def test_participant_wise_json_permissions(test_database, client, login_as):
    login_as("user")
    response = client.get(
        "/api/summary/participants?genes=ENSG00000138131",
        headers={"Accept": "application/json"},
    )
    assert response.status_code == 200
    assert len(response.get_json()) == 6
