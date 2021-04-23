from dataclasses import asdict

from flask import Blueprint, Response, abort, current_app as app, jsonify, request
from flask_login import current_user, login_required
from sqlalchemy.orm import contains_eager
from sqlalchemy.sql import or_

import pandas as pd
from . import models

from .extensions import db

from .utils import (
    check_admin,
    enum_validate,
    filter_in_enum_or_abort,
    filter_updated_or_abort,
    mixin,
    paged,
    transaction_or_abort,
)


variants_blueprint = Blueprint(
    "variants",
    __name__,
)


def get_report_df(df: pd.DataFrame, type: str):
    """
    The expected input is a de-normalized ('tidy') dataframe returned by pd.read_sql. This function subsets relevant columns and retains variants with sufficient depth to annotate zygosity.
    It then returns a sample (participant) wise dataframe, where each row is a participant's variant, the variant annotations, and their genotype,
    or aggregates by variant, where each row is identified by a unique variant and various fields such as depth, zygosity and codenames are concatenated into a single list, delimited by a ';'.
    """

    app.logger.debug(df.head(3))

    df = df[
        [
            "position",
            "reference_allele",
            "alt_allele",
            "variation",
            "refseq_change",
            "depth",
            "gene",
            "conserved_in_20_mammals",
            "sift_score",
            "polyphen_score",
            "cadd_score",
            "gnomad_af",
            "zygosity",
            "burden",
            "alt_depths",
            "dataset_id",
            "participant_id",
            "participant_codename",
            "family_id",
            "family_codename",
        ]
    ]
    df = df.loc[:, ~df.columns.duplicated()]
    # some columns are duplicated eg. dataset_id, is there a way to query so that this doesn't happen?

    df = df[~df["zygosity"].str.contains("-|Insufficient")]

    df = df.astype(str)

    if type == "sample":
        return df

    elif type == "variant":
        df = df.groupby(["position", "reference_allele", "alt_allele"]).agg(
            {
                "variation": "first",
                "refseq_change": "first",
                "depth": list,
                "gene": "first",
                "conserved_in_20_mammals": "first",
                "sift_score": "first",
                "polyphen_score": "first",
                "cadd_score": "first",
                "gnomad_af": "first",
                "zygosity": list,
                "burden": list,
                "alt_depths": list,
                "dataset_id": list,
                "participant_id": list,
                "participant_codename": list,
                "family_id": lambda x: set(x),
                "family_codename": lambda x: set(x),
            },
            axis="columns",
        )

        df["frequency"] = df["participant_codename"].str.len()

        for col in [
            "zygosity",
            "burden",
            "alt_depths",
            "depth",
            "participant_codename",
            "family_codename",
            "dataset_id",
            "participant_id",
            "family_id",
        ]:
            df[col] = df[col].apply(lambda g: "; ".join(g))
        return df


@variants_blueprint.route("/api/summary/participants", methods=["GET"])
@login_required
def participant_summary():

    app.logger.debug("Retrieving user id..")

    if app.config.get("LOGIN_DISABLED") or current_user.is_admin:
        user_id = request.args.get("user")
        app.logger.debug("User is admin with ID '%s'", user_id)
    else:
        user_id = current_user.user_id
        app.logger.debug("User is regular with ID '%s'", user_id)

    app.logger.debug("Parsing query parameters..")

    genes = request.args.get("panel")

    if genes is None or len(genes) == 0:
        app.logger.error("No gene(s) provided in the request body")
        abort(400, description="No gene(s) provided")

    genes = genes.split(";")

    app.logger.info("Requested gene panel: %s", genes)

    filters = [models.Gene.gene == gene for gene in genes]

    # we can't validate whether the requested genes are found in the results (if that is still desired), since gene is no longer a property like in the variant endpoint
    # this may not play well if we decide to pre-populate the entire gene table though since in that case, a gene can be found in the database but not have variants
    gene_query = models.Gene.query.filter(or_(*filters)).all()

    if len(gene_query) == 0:
        app.logger.error("No requested genes were found.")
        abort(400, description="No requested genes were found.")
    elif len(gene_query) < len(genes):
        app.logger.error("Not all requested genes were found.")
        abort(400, description="Not all requested genes were found.")

    if user_id:
        app.logger.debug("Processing query - restricted based on user id.")
        query = (
            db.session.query(models.Dataset)
            .join(models.Participant.tissue_samples)
            .join(models.TissueSample.datasets)
            .join(models.Dataset.genotype)
            .join(models.Genotype.analysis, models.Genotype.variant)
            .join(models.Variant.gene)
            .join(models.Participant.family)
            .join(
                models.groups_datasets_table,
                models.Dataset.dataset_id
                == models.groups_datasets_table.columns.dataset_id,
            )
            .join(
                models.users_groups_table,
                models.groups_datasets_table.columns.group_id
                == models.users_groups_table.columns.group_id,
            )
            .options(
                contains_eager(models.Dataset.genotype)
                .contains_eager(models.Genotype.variant)
                .contains_eager(models.Variant.gene),
                contains_eager(models.Dataset.tissue_sample)
                .contains_eager(models.TissueSample.participant)
                .contains_eager(models.Participant.family),
            )
            .filter(or_(*filters), models.users_groups_table.columns.user_id == user_id)
        )

    else:
        app.logger.debug("Processing query - unrestricted based on user id.")

        query = (
            db.session.query(models.Dataset)
            .join(models.Participant.tissue_samples)
            .join(models.TissueSample.datasets)
            .join(models.Dataset.genotype)
            .join(models.Genotype.analysis, models.Genotype.variant)
            .join(models.Variant.gene)
            .join(models.Participant.family)
            .options(
                contains_eager(models.Dataset.genotype)
                .contains_eager(models.Genotype.variant)
                .contains_eager(models.Variant.gene),
                contains_eager(models.Dataset.tissue_sample)
                .contains_eager(models.TissueSample.participant)
                .contains_eager(models.Participant.family),
            )
            .filter(or_(*filters))
        )

    app.logger.info(request.accept_mimetypes)

    if request.accept_mimetypes["application/json"]:

        app.logger.info("Defaulting to json response")

        q = query.all()
        app.logger.info(
            [
                {
                    "participant_codename": dataset.tissue_sample.participant.participant_codename,
                    "family_codename": dataset.tissue_sample.participant.family.family_codename,
                }
                for dataset in q
            ]
        )
        return jsonify(
            [
                {
                    "participant_codename": dataset.tissue_sample.participant.participant_codename,
                    "family_codename": dataset.tissue_sample.participant.family.family_codename,
                    "dataset": [
                        {
                            "variants": [
                                {
                                    **asdict(genotype),
                                    **asdict(genotype.variant),
                                    "gene": genotype.variant.gene.hgnc_gene_name,
                                }
                                for genotype in dataset.genotype
                            ],
                        }
                    ],
                }
                for dataset in q
            ]
        )
    elif request.accept_mimetypes["text/csv"]:

        app.logger.info("text/csv Accept header requested")

        try:
            sql_df = pd.read_sql(query.statement, query.session.bind)
        except:
            abort(500, "Unexpected error")

        agg_df = get_report_df(sql_df, type="sample")

        csv_data = agg_df.to_csv(encoding="utf-8", index=False)

        response = Response(csv_data, mimetype="text/csv")

        response.headers.set(
            "Content-Disposition", "attachment", filename="sample_wise_report.csv"
        )

        return response
    else:
        app.logger.error(
            "Only 'text/csv' and 'application/json' HTTP accept headers supported"
        )
        abort(
            406, "Only 'text/csv' and 'application/json' HTTP accept headers supported"
        )


@variants_blueprint.route("/api/summary/variants", methods=["GET"])
@login_required
def variant_summary():

    app.logger.debug("Retrieving user id..")

    if app.config.get("LOGIN_DISABLED") or current_user.is_admin:
        user_id = request.args.get("user")
        app.logger.debug("User is admin with ID '%s'", user_id)
    else:
        user_id = current_user.user_id
        app.logger.debug("User is regular with ID '%s'", user_id)

    app.logger.debug("Parsing query parameters..")

    genes = request.args.get("panel")

    if genes is None or len(genes) == 0:
        app.logger.error("No gene(s) provided in the request body")
        abort(400, description="No gene(s) provided")

    genes = genes.split(";")

    app.logger.info("Requested gene panel: %s", genes)

    filters = [models.Gene.gene == gene for gene in genes]

    if user_id:
        app.logger.debug("Processing query - restricted based on user id.")
        query = (
            models.Gene.query.join(models.Gene.variants)
            .join(models.Variant.genotype)
            .join(models.Genotype.analysis, models.Genotype.dataset)
            .join(models.Dataset.tissue_sample)
            .join(models.TissueSample.participant)
            .join(models.Participant.family)
            .join(
                models.groups_datasets_table,
                models.Dataset.dataset_id
                == models.groups_datasets_table.columns.dataset_id,
            )
            .join(
                models.users_groups_table,
                models.groups_datasets_table.columns.group_id
                == models.users_groups_table.columns.group_id,
            )
            .options(
                contains_eager(models.Gene.variants)
                .contains_eager(models.Variant.genotype)
                .contains_eager(models.Genotype.analysis)
                .contains_eager(models.Analysis.datasets)
                .contains_eager(models.Dataset.tissue_sample)
                .contains_eager(models.TissueSample.participant)
                .contains_eager(models.Participant.family),
            )
            .filter(or_(*filters), models.users_groups_table.columns.user_id == user_id)
        )

    else:
        app.logger.debug("Processing query - unrestricted based on user id.")
        query = (
            models.Gene.query.join(models.Gene.variants)
            .join(models.Variant.genotype)
            .join(models.Genotype.analysis, models.Genotype.dataset)
            .join(models.Dataset.tissue_sample)
            .join(models.TissueSample.participant)
            .join(models.Participant.family)
            .options(
                contains_eager(models.Gene.variants)
                .contains_eager(models.Variant.genotype)
                .contains_eager(models.Genotype.analysis)
                .contains_eager(models.Analysis.datasets)
                .contains_eager(models.Dataset.tissue_sample)
                .contains_eager(models.TissueSample.participant)
                .contains_eager(models.Participant.family),
            )
            .filter(or_(*filters))
        )

    # defaults to json unless otherwise specified
    app.logger.info(request.accept_mimetypes)

    if request.accept_mimetypes["application/json"]:

        app.logger.info("Defaulting to json response")

        q = query.all()

        if len(q) == 0:
            app.logger.error("No requested genes were found.")
            abort(400, description="No requested genes were found.")
        elif len(q) < len(genes):
            app.logger.error("Not all requested genes were found.")
            abort(400, description="Not all requested genes were found.")

        return jsonify(
            [
                {
                    **asdict(gene),
                    "variants": [
                        {
                            **asdict(variant),
                            "genotype": [
                                {
                                    **asdict(genotype),
                                    "participant_codename": genotype.dataset.tissue_sample.participant.participant_codename,
                                }
                                for genotype in variant.genotype
                            ],
                        }
                        for variant in gene.variants
                    ],
                }
                for gene in q
            ],
        )
    elif request.accept_mimetypes["text/csv"]:

        app.logger.info("text/csv Accept header requested")

        try:
            sql_df = pd.read_sql(query.statement, query.session.bind)
        except:
            abort(500, "Unexpected error")

        app.logger.info(sql_df["gene"].nunique())

        num_unq_genes = sql_df["gene"].nunique()

        if num_unq_genes == 0:
            app.logger.error("No requested genes were found.")
            abort(400, description="No requested genes were found.")
        elif num_unq_genes < len(genes):
            app.logger.error("Not all requested genes were found.")
            abort(400, description="Not all requested genes were found.")

        agg_df = get_report_df(sql_df, type="variant")

        csv_data = agg_df.to_csv(encoding="utf-8")

        response = Response(csv_data, mimetype="text/csv")

        response.headers.set(
            "Content-Disposition", "attachment", filename="variant_wise_report.csv"
        )

        return response
    else:
        app.logger.error(
            "Only 'text/csv' and 'application/json' HTTP accept headers supported"
        )
        abort(
            406, "Only 'text/csv' and 'application/json' HTTP accept headers supported"
        )
