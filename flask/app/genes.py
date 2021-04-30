from dataclasses import asdict
from io import StringIO
from flask import abort, jsonify, request, Blueprint, Response
from flask_login import login_required
from sqlalchemy import func
from .extensions import db
from .models import Gene
from .utils import paged, query_results_to_csv

genes_blueprint = Blueprint(
    "genes",
    __name__,
)


@genes_blueprint.route("/api/summary/genes", methods=["GET"])
@paged
@login_required
def genes(page: int, limit: int):
    """ index route for genes """
    search = request.args.get("search", type=str)
    gene_query = db.session.query(Gene)
    if search:
        gene_query = gene_query.filter(func.instr(Gene.hgnc_gene_name, search))

    total_count = gene_query.with_entities(
        func.count(func.distinct(Gene.gene_id))
    ).scalar()

    results = gene_query.limit(limit).offset(page * (limit or 0)).all()

    # default to json if accept = */*
    if request.accept_mimetypes["application/json"]:
        return jsonify(
            {
                "data": results,
                "page": page if limit else 0,
                "total_count": total_count,
            }
        )

    if request.accept_mimetypes["text/csv"]:
        csv = query_results_to_csv(results)
        response = Response(csv)

        response.headers["Content-Disposition"] = "attachment;filename=gene_report.csv"
        response.headers["Content-Type"] = "text/csv"

        return response

    abort(406, "Only 'text/csv' and 'application/json' HTTP accept headers supported")


@genes_blueprint.route("/api/summary/genes/<string:hgnc_gene_name>", methods=["GET"])
@login_required
def get_gene_hgnc_name(hgnc_gene_name: str):
    """ return a gene based on ghnc gene name """
    gene_query = db.session.query(Gene)
    result = gene_query.filter(Gene.hgnc_gene_name == hgnc_gene_name).first_or_404()

    return jsonify(result)


@genes_blueprint.route("/api/summary/genes/hgnc/<int:hgnc_id>", methods=["GET"])
@login_required
def get_gene_hgnc_id(hgnc_id: int):
    """ return a gene based on ghnc gene id """
    gene_query = db.session.query(Gene)
    result = gene_query.filter(Gene.hgnc_gene_id == hgnc_id).first_or_404()

    return jsonify(result)


@genes_blueprint.route("/api/summary/genes/ensg/<int:ensg_id>", methods=["GET"])
@login_required
def get_gene_ensg_id(ensg_id: int):
    """ return a gene based on emsebl id """
    gene_query = db.session.query(Gene)
    result = gene_query.filter(Gene.ensembl_id == ensg_id).first_or_404()

    return jsonify(result)
