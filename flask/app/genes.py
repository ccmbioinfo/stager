from dataclasses import asdict
from typing import Any, Dict
from flask import abort, jsonify, request, Blueprint
from flask_login import login_required
from sqlalchemy import func
from sqlalchemy.orm import contains_eager, joinedload
from .extensions import db
from .models import Gene, GeneAlias
from .utils import csv_response, expects_csv, expects_json, paged, paginated_response

genes_blueprint = Blueprint(
    "genes",
    __name__,
)


@genes_blueprint.route("/api/summary/genes", methods=["GET"])
@paged
@login_required
def genes(page: int, limit: int):
    """index route for genes"""
    search = request.args.get("search", type=str)
    gene_query = GeneAlias.query
    if search:
        gene_query = gene_query.filter(func.instr(GeneAlias.name, search))

    total_count = gene_query.with_entities(
        func.count(func.distinct(GeneAlias.alias_id))
    ).scalar()

    results = gene_query.limit(limit).offset(page * (limit or 0)).all()

    if expects_json(request):
        return paginated_response(results, page, total_count, limit)
    elif expects_csv(request):
        return csv_response(results)

    abort(406, "Only 'text/csv' and 'application/json' HTTP accept headers supported")


def serialize(gene: Gene) -> Dict[str, Any]:
    return {
        **asdict(gene),
        "aliases": [{"name": alias.name, "kind": alias.kind} for alias in gene.aliases],
    }


@genes_blueprint.route("/api/summary/genes/<string:name>", methods=["GET"])
@login_required
def get_gene_by_name(name: str):
    """return a gene based on aliased name"""
    gene = (
        Gene.query.options(contains_eager(Gene.aliases))
        .join(Gene.aliases)
        .filter(GeneAlias.name == name)
        .first_or_404()
    )
    return jsonify(serialize(gene))


@genes_blueprint.route("/api/summary/genes/ensg/<int:ensembl_id>", methods=["GET"])
@login_required
def get_gene_ensg_id(ensembl_id: int):
    """return a gene based on ensembl id (ensg)"""
    gene = (
        Gene.query.options(joinedload(Gene.aliases))
        .filter_by(ensembl_id=ensembl_id)
        .first_or_404()
    )
    return jsonify(serialize(gene))
