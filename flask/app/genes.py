from flask import abort, jsonify, request, Blueprint, Response
from flask_login import login_required
from sqlalchemy import func
from .extensions import db
from .models import Gene
from .utils import paged
import traceback

genes_blueprint = Blueprint(
    "genes",
    __name__,
)


@genes_blueprint.route("/api/summary/genes", methods=["GET"])
@paged
@login_required
def genes(page, limit):
    """ index route for genes """
    search = request.args.get("search", type=str)
    gene_query = db.session.query(Gene)
    if search:
        gene_query = gene_query.filter(func.instr(Gene.hgnc_gene_name, search))

    total_count = gene_query.with_entities(
        func.count(func.distinct(Gene.gene_id))
    ).scalar()
    if limit and page:
        gene_query.limit(limit).offset(page * limit)
    results = gene_query.all()

    # deault to json is accept = */*
    if request.accept_mimetypes["application/json"]:
        return jsonify(
            {
                "data": results,
                "page": page if limit else 0,
                "total_count": total_count,
            }
        )

    if request.accept_mimetypes["text/csv"]:
        # TODO
        csv_data = []
        return Response(csv_data, mimetype="text/csv")

    abort(415, "Mime-Type must be text/csv or application/json!")


@genes_blueprint.route("/api/summary/genes/hgnc/<int:hgnc_id>", methods=["GET"])
@login_required
def get_gene_hgnc_id(hgnc_id):
    """ return a gene based on ghnc gene id """
    gene_query = db.session.query(Gene)
    result = gene_query.filter(Gene.hgnc_gene_id == hgnc_id).first()

    if not result:
        abort(404, f"No gene found with hgnc_id {hgnc_id}")

    return jsonify(result)


@genes_blueprint.route("/api/summary/genes/ensg/<int:ensg_id>", methods=["GET"])
@login_required
def get_gene_ensg_id(ensg_id):
    """ return a gene based on emsebl id """
    gene_query = db.session.query(Gene)
    result = gene_query.filter(Gene.ensembl_id == ensg_id).first()

    if not result:
        abort(404, f"No gene found with emsembl_id {ensg_id}")

    return jsonify(result)