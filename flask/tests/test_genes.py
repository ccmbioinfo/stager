""" test gene api endpoings """
from csv import reader
from app import db
from app.models import Gene, GeneAlias


def setup_db():
    """seed db with minimal data"""
    db.session.add(Gene(ensembl_id=1000, chromosome="X", start=2, end=4))
    db.session.flush()
    db.session.add(GeneAlias(ensembl_id=1000, name="FOOBAR"))
    db.session.commit()


def test_fetch_genes_json(test_database, client, login_as):
    """can we fetch genes as json?"""
    setup_db()
    login_as("user")
    response = client.get("/api/summary/genes", headers={"Accept": "*/*"})
    assert response.status_code == 200
    """ note there may be a variable number of genes in the db from the default seeds """
    assert len(response.get_json()["data"]) >= 1
    assert response.get_json()["total_count"] >= 1


def test_fetch_genes_csv(test_database, client, login_as):
    """can we fetch genes as csv?"""
    setup_db()
    login_as("user")
    response = client.get("/api/summary/genes", headers={"Accept": "text/csv"})
    assert response.status_code == 200
    assert response.headers["Content-Type"] == "text/csv; charset=utf-8"
    gene_reader = reader(response.data.decode().split("\n"))
    rows = [row for row in gene_reader if len(row)]
    for item in rows[0]:
        assert item in GeneAlias.__table__.columns

    assert (len(rows) - 1) == GeneAlias.query.count()


def test_search_genes(test_database, client, login_as):
    """can we filter genes based on a search string?"""
    setup_db()
    login_as("user")
    response = client.get(
        "/api/summary/genes?search=FOO", headers={"Accept": "application/json"}
    )
    assert response.status_code == 200
    assert len(response.get_json()["data"]) == 1

    no_response = client.get(
        "/api/summary/genes?search=FOOZ", headers={"Accept": "application/json"}
    )
    assert no_response.status_code == 200
    assert len(no_response.get_json()["data"]) == 0
    assert no_response.get_json()["total_count"] == 0


def test_fetch_gene_by_alias(test_database, client, login_as):
    """can we fetch a gene by alias"""
    setup_db()
    login_as("user")
    response = client.get("/api/summary/genes/FOOBAR")
    assert response.status_code == 200
    assert response.get_json()["ensembl_id"] == 1000

    no_response = client.get("/api/summary/genes/BARBAR")
    assert no_response.status_code == 404


def test_fetch_gene_by_ensembl_id(test_database, client, login_as):
    """can we fetch a gene by ensembl id"""
    setup_db()
    login_as("user")
    response = client.get("/api/summary/genes/ensg/1000")
    assert response.status_code == 200
    assert response.get_json()["ensembl_id"] == 1000

    no_response = client.get("/api/summary/genes/ensg/5")
    assert no_response.status_code == 404
