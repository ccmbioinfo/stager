from io import BytesIO
import pandas as pd


def test_variant_wise_json_single_search(test_database, client, login_as):
    login_as("admin")

    endpoints = [
        # LOXL4
        ("/api/summary/variants?genes=ENSG00000138131", 3),
        ("/api/summary/variants?regions=chr10:100007447-100027951", 3),
        (
            "/api/summary/variants?regions=chr10:100027951-100007447",
            3,
        ),  # start-end order agnostic
        ("/api/summary/variants?positions=chr10:100010909", 1),
    ]

    for endpoint in endpoints:
        url, result_count = endpoint
        print(url)
        response = client.get(
            url,  # LOXL4
            headers={"Accept": "application/json"},
        )
        assert response.status_code == 200
        assert len(response.get_json()) == result_count  # variants


def test_variant_wise_json_multiple_search(test_database, client, login_as):
    login_as("admin")

    urls = [
        # LOXL4, RTEL1
        "/api/summary/variants?genes=ENSG00000138131,ENSG00000258366",
        "/api/summary/variants?regions=chr10:100007447-100027951,chr20:62289163-62327606",
        "/api/summary/variants?regions=chr10:100010000-100020000,chr20:62320000-62330000",
        "/api/summary/variants?positions=chr10:100010909,chr10:100016572,chr10:100016632,chr20:62326518,chr20:62326938,chr20:62327126",
    ]

    for url in urls:
        print(url)
        response = client.get(
            url,
            headers={"Accept": "application/json"},
        )
        assert response.status_code == 200
        assert len(response.get_json()) == 6  # variants across the two genes


def test_variant_wise_json_invalid_search(test_database, client, login_as):
    login_as("admin")

    urls = [
        "/api/summary/variants?genes=BADGENENAME",  # bad ensg
        "/api/summary/variants?regions=4:5000-6000",  # missing chr prefix
        "/api/summary/variants?regions=chr10:100010000",  # missing range
        "/api/summary/variants?regions=chr10:over-there",  # not numbers
        "/api/summary/variants?positions=10:100010909",  # missing chr prefix
        "/api/summary/variants?positions=chr10:somewhere",  # not numbers
        "/api/summary/variants?positions=chr10:-5",  # negative
    ]

    for url in urls:
        print(url)
        response = client.get(
            url,
            headers={"Accept": "application/json"},
        )
        assert response.status_code == 400


def test_variant_wise_json_gene_not_found(test_database, client, login_as):
    login_as("admin")

    urls = [
        ("/api/summary/variants?genes=ENSG00000138131,ENSG0", 400),
        ("/api/summary/variants?regions=chr1:1-2", 404),
        ("/api/summary/variants?positions=chr1:5", 404),
    ]

    for url in urls:
        print(url)
        response = client.get(
            url[0],
            headers={"Accept": "application/json"},
        )
        assert response.status_code == url[1]


def test_variant_wise_csv_single_search(test_database, client, login_as):
    login_as("admin")

    urls = [
        # LOXL4
        ("/api/summary/variants?genes=ENSG00000138131", 3),
        ("/api/summary/variants?regions=chr10:100007447-100027951", 3),
        (
            "/api/summary/variants?regions=chr10:100027951-100007447",
            3,
        ),  # start-end order agnostic
        ("/api/summary/variants?positions=chr10:100010909", 1),
    ]

    for url in urls:
        print(url)
        response = client.get(url[0], headers={"Accept": "text/csv"})
        df = pd.read_csv(BytesIO(response.get_data()), encoding="utf8")
        assert df.shape[0] == url[1]


def test_variant_wise_csv_multiple_search(test_database, client, login_as):
    login_as("admin")

    urls = [
        # LOXL4, RTEL1
        "/api/summary/variants?genes=ENSG00000138131,ENSG00000258366",
        "/api/summary/variants?regions=chr10:100007447-100027951,chr20:62289163-62327606",
        "/api/summary/variants?regions=chr10:100010000-100020000,chr20:62320000-62330000",
        "/api/summary/variants?positions=chr10:100010909,chr10:100016572,chr10:100016632,chr20:62326518,chr20:62326938,chr20:62327126",
    ]

    for url in urls:
        print(url)
        response = client.get(
            url,
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


def test_participant_wise_json_single_search(test_database, client, login_as):
    login_as("admin")

    urls = [
        ("/api/summary/participants?genes=ENSG00000138131", 6),
        ("/api/summary/participants?regions=chr10:100007447-100027951", 6),
        ("/api/summary/participants?positions=chr10:100010909", 2),
    ]

    for url in urls:
        print(url)
        response = client.get(
            url[0],
            headers={"Accept": "application/json"},
        )
        assert response.status_code == 200
        # num. of participant-variants (1x6)
        assert len(response.get_json()) == url[1]
        # remove nested structure


def test_participant_wise_json_multiple_search(test_database, client, login_as):
    login_as("admin")

    urls = [
        ("/api/summary/participants?genes=ENSG00000138131,ENSG00000258366", 12),
        (
            "/api/summary/participants?regions=chr10:100007447-100027951,chr20:62289163-62327606",
            12,
        ),
        (
            "/api/summary/participants?positions=chr10:100010909,chr10:100016572,chr10:100016632,chr20:62326518,chr20:62326938,chr20:62327126",
            12,
        ),
    ]

    for url in urls:
        response = client.get(
            url[0],
            headers={"Accept": "application/json"},
        )
        assert response.status_code == 200
        # num. of participant-variants (2x6)
        assert len(response.get_json()) == url[1]


def test_participant_wise_json_invalid_search(test_database, client, login_as):
    login_as("admin")

    urls = [
        "/api/summary/participants?genes=BADGENENAME",  # bad ensg
        "/api/summary/participants?regions=4:5000-6000",  # missing chr prefix
        "/api/summary/participants?regions=chr10:100010000",  # missing range
        "/api/summary/participants?regions=chr10:over-there",  # not numbers
        "/api/summary/participants?positions=10:100010909",  # missing chr prefix
        "/api/summary/participants?positions=chr10:somewhere",  # not numbers
        "/api/summary/participants?positions=chr10:-5",  # negative
    ]

    for url in urls:
        print(url)
        response = client.get(
            url,
            headers={"Accept": "application/json"},
        )
        assert response.status_code == 400


def test_participant_wise_json_gene_not_found(test_database, client, login_as):
    login_as("admin")

    urls = [
        ("/api/summary/participants?genes=ENSG00000138131,HGNC:0000", 400),
        ("/api/summary/participants?regions=chr1:1-2", 404),
        ("/api/summary/participants?positions=chr1:5", 404),
    ]
    for url in urls:
        print(url)
        response = client.get(
            url[0],
            headers={"Accept": "application/json"},
        )
        assert response.status_code == url[1]


def test_participant_wise_csv_single_gene(test_database, client, login_as):
    login_as("admin")

    urls = [
        ("/api/summary/participants?genes=ENSG00000138131", 5),
        ("/api/summary/participants?regions=chr10:100007447-100027951", 5),
        (
            "/api/summary/participants?regions=chr10:100027951-100007447",
            5,
        ),  # start-end order agnostic
        ("/api/summary/participants?positions=chr10:100010909", 2),
    ]

    for url in urls:
        print(url)
        response = client.get(
            url[0],
            headers={"Accept": "text/csv"},
        )
        df = pd.read_csv(BytesIO(response.get_data()), encoding="utf8")
        # the number of variants for the given participants in LOXL4 that have sufficient depth for zygosity (5)
        assert df.shape[0] == url[1]


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
