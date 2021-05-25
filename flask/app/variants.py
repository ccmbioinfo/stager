from dataclasses import asdict
from typing import Any, List

from flask import Blueprint, Response, abort, current_app as app, jsonify, request
from flask_login import current_user, login_required
from sqlalchemy import distinct, func
from sqlalchemy.orm import contains_eager
from sqlalchemy.sql import and_, or_

import pandas as pd
from . import models

from .utils import expects_csv, expects_json


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
            "chromosome",
            "position",
            "reference_allele",
            "alt_allele",
            "variation",
            "refseq_change",
            "depth",
            "conserved_in_20_mammals",
            "sift_score",
            "polyphen_score",
            "cadd_score",
            "gnomad_af",
            "zygosity",
            "burden",
            "alt_depths",
            "dataset_id",
            "participant_codename",
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
                "chromosome": "first",
                "refseq_change": "first",
                "depth": list,
                "conserved_in_20_mammals": "first",
                "sift_score": "first",
                "polyphen_score": "first",
                "cadd_score": "first",
                "gnomad_af": "first",
                "zygosity": list,
                "burden": list,
                "alt_depths": list,
                "dataset_id": list,
                "participant_codename": list,
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
        ]:
            df[col] = df[col].apply(lambda g: "; ".join(g))
        return df


def parse_gene_panel() -> List[Any]:
    """
    Parses query string parameter ?panel=ENSGXXXXXXXX,ENSGXXXXXXX
    """
    genes = request.args.get("panel", type=str)
    if genes is None or len(genes) == 0:
        app.logger.error("No gene(s) provided in the request body")
        abort(400, description="No gene(s) provided")
    genes = genes.lower().split(",")
    app.logger.info("Requested gene panel: %s", genes)
    ensgs = []
    errors = []
    for gene in genes:
        if gene.startswith("ensg"):
            try:
                ensgs.append(int(gene[4:]))
            except ValueError:
                errors.append(gene)
        else:
            errors.append(gene)
    if len(errors):
        app.logger.error(f"Bad gene panel: {errors}")
        abort(400, description=f"Bad gene panel: {','.join(errors)}")

    # we can't validate whether the requested genes are found in the results (if that is still desired), since gene is no longer a property like in the variant endpoint
    # this may not play well if we decide to pre-populate the entire gene table though since in that case, a gene can be found in the database but not have variants
    # Again, we customize the count query for efficiency
    query = models.Gene.query.filter(models.Gene.ensembl_id.in_(ensgs))
    found_genes = query.with_entities(
        func.count(distinct(models.Gene.ensembl_id))
    ).scalar()
    if found_genes == 0:
        app.logger.error("No requested genes were found.")
        abort(400, description="No requested genes were found.")
    elif found_genes < len(genes):
        app.logger.error("Not all requested genes were found.")
        abort(400, description="Not all requested genes were found.")

    genes = query.all()
    return [
        and_(
            gene.chromosome == models.Variant.chromosome,
            gene.start <= models.Variant.position,
            models.Variant.position <= gene.end,
        )
        for gene in genes
    ]


@variants_blueprint.route("/api/summary/participants", methods=["GET"])
@login_required
def participant_summary():
    """
    GET /api/summary/participants?panel=ENSGXXXXXXXX,ENSGXXXXXXX
    """
    if app.config.get("LOGIN_DISABLED") or current_user.is_admin:
        user_id = request.args.get("user")
        app.logger.debug("User is admin with ID '%s'", user_id)
    else:
        user_id = current_user.user_id
        app.logger.debug("User is regular with ID '%s'", user_id)

    filters = parse_gene_panel()

    query = (
        models.Dataset.query.options(
            contains_eager(models.Dataset.genotype).contains_eager(
                models.Genotype.variant
            ),
            contains_eager(models.Dataset.tissue_sample)
            .contains_eager(models.TissueSample.participant)
            .contains_eager(models.Participant.family),
        )
        .join(models.Participant.tissue_samples)
        .join(models.TissueSample.datasets)
        .join(models.Dataset.genotype)
        .join(models.Genotype.analysis, models.Genotype.variant)
        .join(models.Participant.family)
        .filter(or_(*filters))
    )

    if user_id:
        app.logger.debug("Processing query - restricted based on user id.")
        query = (
            query.join(
                models.groups_datasets_table,
                models.Dataset.dataset_id
                == models.groups_datasets_table.columns.dataset_id,
            )
            .join(
                models.users_groups_table,
                models.groups_datasets_table.columns.group_id
                == models.users_groups_table.columns.group_id,
            )
            .filter(models.users_groups_table.columns.user_id == user_id)
        )

    else:
        app.logger.debug("Processing query - unrestricted based on user id.")

    app.logger.info(request.accept_mimetypes)

    if expects_json(request):
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
                    "participant_id": dataset.tissue_sample.participant.participant_id,
                    "participant_codename": dataset.tissue_sample.participant.participant_codename,
                    "family_id": dataset.tissue_sample.participant.family.family_id,
                    "family_codename": dataset.tissue_sample.participant.family.family_codename,
                    "dataset": {
                        "variants": [
                            {
                                **asdict(genotype),
                                **asdict(genotype.variant),
                            }
                            for genotype in dataset.genotype
                        ],
                    },
                }
                for dataset in q
            ]
        )
    elif expects_csv(request):
        app.logger.info("text/csv Accept header requested")

        try:
            sql_df = pd.read_sql(query.statement, query.session.bind)
        except:
            app.logger.error(
                "Unexpected error resulting from sqlalchemy query", exc_info=True
            )
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
    """
    GET /api/summary/variants?panel=ENSGXXXXXXXX,ENSGXXXXXXX
    """
    if app.config.get("LOGIN_DISABLED") or current_user.is_admin:
        user_id = request.args.get("user")
        app.logger.debug("User is admin with ID '%s'", user_id)
    else:
        user_id = current_user.user_id
        app.logger.debug("User is regular with ID '%s'", user_id)

    filters = parse_gene_panel()

    query = (
        models.Variant.query.options(
            contains_eager(models.Variant.genotype)
            .contains_eager(models.Genotype.analysis)
            .contains_eager(models.Analysis.datasets)
            .contains_eager(models.Dataset.tissue_sample)
            .contains_eager(models.TissueSample.participant)
            .contains_eager(models.Participant.family),
        )
        .join(models.Variant.genotype)
        .join(models.Genotype.analysis, models.Genotype.dataset)
        .join(models.Dataset.tissue_sample)
        .join(models.TissueSample.participant)
        .join(models.Participant.family)
        .filter(or_(*filters))
    )
    if user_id:
        app.logger.debug("Processing query - restricted based on user id.")
        query = (
            query.join(
                models.groups_datasets_table,
                models.Dataset.dataset_id
                == models.groups_datasets_table.columns.dataset_id,
            )
            .join(
                models.users_groups_table,
                models.groups_datasets_table.columns.group_id
                == models.users_groups_table.columns.group_id,
            )
            .filter(models.users_groups_table.columns.user_id == user_id)
        )
    else:
        app.logger.debug("Processing query - unrestricted based on user id.")

    # defaults to json unless otherwise specified
    app.logger.info(request.accept_mimetypes)

    if expects_json(request):
        app.logger.info("Defaulting to json response")
        q = query.all()
        return jsonify(
            [
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
                for variant in q
            ],
        )
    elif expects_csv(request):
        app.logger.info("text/csv Accept header requested")
        try:
            sql_df = pd.read_sql(query.statement, query.session.bind)
        except:
            app.logger.error(
                "Unexpected error resulting from sqlalchemy query", exc_info=True
            )
            abort(500, "Unexpected error")

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
