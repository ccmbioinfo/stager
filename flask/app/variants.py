from dataclasses import asdict
import re
from typing import Any, List

from flask import Blueprint, Response, abort, current_app as app, jsonify, request
from flask_login import current_user, login_required
import pandas as pd
from sqlalchemy import distinct, func
from sqlalchemy.orm import aliased, contains_eager
from sqlalchemy.sql import and_, or_

from . import models
from .extensions import db
from .utils import expects_csv, expects_json


variants_blueprint = Blueprint(
    "variants",
    __name__,
)

relevant_cols = [
    "ensembl_id",
    "name",
    "chromosome",
    "position",
    "reference_allele",
    "alt_allele",
    "ucsc_link",
    "gnomad_link",
    "gene",  # from the reports
    "info",
    "quality",
    "clinvar",
    "gnomad_af_popmax",
    "gnomad_ac",
    "gnomad_hom",
    "report_ensembl_gene_id",
    "ensembl_transcript_id",
    "aa_position",
    "exon",
    "protein_domains",
    "rsids",
    "gnomad_oe_lof_score",
    "gnomad_oe_mis_score",
    "exac_pli_score",
    "exac_prec_score",
    "exac_pnull_score",
    "spliceai_impact",
    "spliceai_score",
    "vest3_score",
    "revel_score",
    "gerp_score",
    "imprinting_status",
    "imprinting_expressed_allele",
    "pseudoautosomal",
    # "number_of_callers",
    # "old_multiallelic",
    "uce_100bp",
    "uce_200bp",
    "genotype",
    "coverage",
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


def get_report_df(df: pd.DataFrame, type: str, relevant_cols=relevant_cols):
    """
    The expected input is a de-normalized ('tidy') dataframe returned by pd.read_sql. This function subsets relevant columns and retains variants with sufficient depth to annotate zygosity.
    It then returns a sample (participant)  wise dataframe, where each row is a participant's variant, the variant annotations, and their genotype,
    or aggregates by variant, where each row is identified by a unique variant and various fields such as depth, zygosity and codenames are concatenated into a single list, delimited by a ';'.
    """

    app.logger.debug(df.head(3))

    # subsetting by a list of col names ensures ordering is consistent between the two report types

    df = df.loc[:, ~df.columns.duplicated()]
    df = df[relevant_cols]

    # some columns are duplicated eg. dataset_id, is there a way to query so that this doesn't happen?

    df = df[~df["zygosity"].str.contains("-|Insufficient")]
    df = df.fillna("")
    df = df.astype(str)
    df["ensembl_id"] = df["ensembl_id"].apply(lambda x: "ENSG" + x.rjust(11, "0"))

    if type == "participants":
        return df

    elif type == "variants":
        df = (
            df.groupby(["position", "reference_allele", "alt_allele"])
            .agg(
                {
                    "ensembl_id": set,
                    "chromosome": "first",
                    "ucsc_link": "first",
                    "gnomad_link": "first",
                    "clinvar": "first",
                    "gnomad_af_popmax": "first",
                    "gnomad_ac": "first",
                    "gnomad_hom": "first",
                    "report_ensembl_gene_id": set,
                    "ensembl_transcript_id": set,
                    "aa_position": "first",
                    "exon": "first",
                    "protein_domains": "first",
                    "rsids": set,
                    "gnomad_oe_lof_score": "first",
                    "gnomad_oe_mis_score": "first",
                    "exac_pli_score": "first",
                    "exac_prec_score": "first",
                    "exac_pnull_score": "first",
                    "spliceai_impact": "first",
                    "spliceai_score": "first",
                    "vest3_score": "first",
                    "revel_score": "first",
                    "gerp_score": "first",
                    "imprinting_status": "first",
                    "imprinting_expressed_allele": "first",
                    "pseudoautosomal": "first",
                    # "number_of_callers"
                    # "old_multiallelic": list,
                    "uce_100bp": "first",
                    "uce_200bp": "first",
                    "genotype": list,
                    "coverage": list,
                    "info": list,
                    "quality": list,
                    "gene": list,
                    "variation": "first",
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
                    "family_codename": set,
                    "name": "first",
                },
                axis="columns",
            )
            .reset_index()
        )
        df = df[relevant_cols]

        df["frequency"] = df["participant_codename"].str.len()
        for col in [
            "ensembl_id",
            "zygosity",
            "burden",
            "alt_depths",
            "depth",
            "genotype",
            "coverage",
            "info",
            "quality",
            "gene",
            "rsids",
            "report_ensembl_gene_id",
            "ensembl_transcript_id",
            "participant_codename",
            "family_codename",
            "dataset_id",
        ]:
            df[col] = df[col].apply(lambda g: "; ".join(g))
        return df


def parse_gene_panel(genes: str):
    """
    Parses query string parameter ?panel=ENSGXXXXXXXX,ENSGXXXXXXX.
    We abort if the panel parameter is missing or malformed. If any specified gene isn't
    in our database, we also abort.
    Returns a list of filters for use against the variant table to find corresponding variants
    based on gene start and end positions.
    """
    genes_list = genes.lower().split(",")
    app.logger.info("Requested gene panel: %s", genes_list)
    ensgs = set()
    errors = []
    for gene in genes_list:
        if gene.startswith("ensg"):
            try:
                ensgs.add(int(gene[4:]))
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
    gene_filter = models.Gene.ensembl_id.in_(ensgs)

    query = models.Gene.query.filter(gene_filter)
    found_genes = query.with_entities(
        func.count(distinct(models.Gene.ensembl_id))
    ).scalar()
    if found_genes == 0:
        app.logger.error("No requested genes were found.")
        abort(400, description="No requested genes were found.")
    elif found_genes < len(ensgs):
        app.logger.error("Not all requested genes were found.")
        abort(400, description="Not all requested genes were found.")

    # genes_list = query.all()

    app.logger.debug("Found %d genes with panel %s", found_genes, ensgs)

    return gene_filter


def parse_region(region: str):
    """
    Parses a given list of ranges (eg. "chr1:0500-0509,chr5:0600-0630,chr18:0440-0330").
    Returns a filter for use against the variant table to find corresponding variants
    based on gene start and end positions.
    """
    CHR, START, END = 0, 1, 2
    # format check
    # 1: chromosome, 2: start position, 3: end position
    region_pattern = re.compile(r"^chr([\da-zA-Z]+):([\d]+)-([\d]+)$")
    matches = [region_pattern.match(r) for r in region.split(",")]

    app.logger.info("Requested region: %s", region)

    if not all(match is not None and len(match.groups()) == 3 for match in matches):
        app.logger.error("Invalid region format: %s", region)
        abort(400, description="Invalid region format")

    # prepare set of regions
    region_list = []
    for r in set([match.groups() for match in matches]):
        # fix regions to be consistent (start-end)
        if int(r[START]) > int(r[END]):
            region_list.append((r[CHR], r[END], r[START]))
        else:
            region_list.append(r)

    # query
    region_filter = or_(
        *[
            and_(
                models.Variant.chromosome == tup[CHR],
                int(tup[START]) <= models.Variant.position,
                models.Variant.position <= int(tup[END]),
            )
            for tup in region_list
        ]
    )

    return region_filter


def parse_position(position: str):
    """
    Parses a given list of positions and chromosomes (eg. "chr1:5000,chrY:8000").
    Returns a filter for use against the variant table to find corresponding variants
    based on gene start and end positions.
    """
    CHR, POS = 0, 1
    # format check
    # 1: chromosome, 2: position
    position_pattern = re.compile(r"^chr([\da-zA-Z]+):([\d]+)$")
    matches = [position_pattern.match(p) for p in position.split(",")]

    app.logger.info("Requested position: %s", position)

    if not all(match is not None and len(match.groups()) == 2 for match in matches):
        app.logger.error("Invalid position format: %s", position)
        abort(400, description="Invalid position format")

    # prepare set of positions
    position_set = set([match.groups() for match in matches])

    # query
    position_filter = or_(
        *[
            and_(
                models.Variant.chromosome == tup[CHR].upper(),
                models.Variant.position == tup[POS],
            )
            for tup in position_set
        ]
    )

    return position_filter


def parse_rsid(rsid: str):
    rsid_pattern = re.compile(r"^rs[\d]+$")
    matches = [rsid_pattern.match(p) for p in rsid.split(",")]

    if not all(match is not None for match in matches):
        app.logger.error("Invalid rsID format: %s", rsid)
        abort(400, description="Invalid rsID format")

    rsid_set = set(["%{}%".format(match.group()) for match in matches])

    rsid_filter = or_(*[models.Variant.rsids.like(r) for r in rsid_set])

    return rsid_filter


def parse_requested_filter(search_type: str, param: str):
    if search_type == "genes":
        return parse_gene_panel(param)
    if search_type == "regions":
        return parse_region(param)
    if search_type == "positions":
        return parse_position(param)
    if search_type == "rsids":
        return parse_rsid(param)

    # This shouldn't happen
    app.logger.error("Invalid search type '%s'", search_type)
    abort(400, description="Invalid parameter")


@variants_blueprint.route("/api/summary/<string:type>", methods=["GET"])
@login_required
def summary(type: str):
    """
    GET /api/summary/participants?genes=ENSG00000138131
    GET /api/summary/participants?positions=chr1:5000,chr2:6000
    GET /api/summary/participants?regions=chr1:5000-6000,chrX:5000-6000

    The same sqlalchemy query is used for both endpoints as the participant-wise report is the precursor to the variant-wise report.

    The JSON response for participants is de-normalized such that each object is a participant and a variant,
    whereas for the variant JSON response, each object is a variant, the annotations, and an array of genotypes for the involved participants.

    Similarly, the csv output for the participants is de-normalized such that each row is a participant's variant. If the requested genes span similar coordinates duplicated variants will be returned, for each gene.
    The variant csv output is a summary - each row is a unique variant with various columns collapsed and ';' delimited indicating for example, all participants that had such a variant.

    """
    # validate parameters such that only one search type is requested
    valid_search_types = {"genes", "positions", "regions", "rsids"}
    requested_types = list(
        filter(lambda type: request.args.get(type) is not None, valid_search_types)
    )
    if len(requested_types) > 1:
        app.logger.error("Too many search types requested: %s", str(requested_types))
        abort(400, description="Too many search types requested")
    if len(requested_types) == 0:
        app.logger.error("No search types requested")
        abort(400, description="No search types requested")

    search_type = requested_types[0]

    if type not in ["variants", "participants"]:
        abort(404)

    if app.config.get("LOGIN_DISABLED") or current_user.is_admin:
        user_id = request.args.get("user")
        app.logger.debug("User is admin with ID '%s'", user_id)
    else:
        user_id = current_user.user_id
        app.logger.debug("User is regular with ID '%s'", user_id)

    variant_filter = parse_requested_filter(
        search_type, request.args.get(search_type, type=str)
    )

    query = models.Variant.query.filter(variant_filter)
    num_matched = query.with_entities(
        func.count(distinct(models.Variant.variant_id))
    ).scalar()

    if num_matched == 0:
        app.logger.error("No variants found")
        abort(404, description="No variants found")

    # filter out all gene aliases except current_approved_symbol and make result an `aliased` subquery \
    # so that ORM recognizes it as the GeneAlias model when joining and eager loading
    alias_subquery = aliased(
        models.GeneAlias,
        models.GeneAlias.query.filter(
            models.GeneAlias.kind == "current_approved_symbol"
        ).subquery(),
    )

    # returns a tuple (Genes, Variants)
    query = (
        db.session.query(models.Gene, models.Variant)
        .options(
            contains_eager(models.Variant.genotype)
            .contains_eager(models.Genotype.analysis)
            .contains_eager(models.Analysis.datasets)
            .contains_eager(models.Dataset.tissue_sample)
            .contains_eager(models.TissueSample.participant)
            .contains_eager(models.Participant.family),
            contains_eager(models.Gene.aliases.of_type(alias_subquery)),
        )
        .join(
            models.Variant,
            and_(
                models.Gene.chromosome == models.Variant.chromosome,
                models.Gene.start <= models.Variant.position,
                models.Variant.position <= models.Gene.end,
            ),
        )
        .join(models.Variant.genotype)
        .join(models.Genotype.analysis, models.Genotype.dataset)
        .join(models.Dataset.tissue_sample)
        .join(models.TissueSample.participant)
        .join(models.Participant.family)
        .outerjoin(alias_subquery)
        .filter(variant_filter)
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

        if type == "variants":

            return jsonify(
                [
                    {
                        **asdict(tup[0]),  # gene
                        "name": tup[0].aliases[0].name if tup[0].aliases else None,
                        **asdict(tup[1]),  # variants
                        "genotype": [
                            {
                                **asdict(genotype),
                                "participant_codename": genotype.dataset.tissue_sample.participant.participant_codename,
                            }
                            for genotype in tup[1].genotype
                        ],
                    }
                    for tup in query.all()
                ]
            )

        elif type == "participants":
            try:
                sql_df = pd.read_sql(query.statement, query.session.bind)
            except:
                app.logger.error(
                    "Unexpected error resulting from sqlalchemy query", exc_info=True
                )
                abort(500, "Unexpected error")

            ptp_dict = sql_df.loc[:, ~sql_df.columns.duplicated()][
                relevant_cols
            ].to_dict(orient="records")
            return jsonify(ptp_dict)

    elif expects_csv(request):
        app.logger.info("text/csv Accept header requested")
        try:
            sql_df = pd.read_sql(query.statement, query.session.bind)
        except:
            app.logger.error(
                "Unexpected error resulting from sqlalchemy query", exc_info=True
            )
            abort(500, "Unexpected error")

        agg_df = get_report_df(sql_df, type=type)

        columns = request.args.get("columns", type=str)
        if columns is not None:
            columns = {*columns.split(",")}
            # filter out faulty columns
            valid_columns = {col for col in agg_df.columns.values}
            # maintain the order set by relevant_cols
            fixed_columns = [
                col for col in relevant_cols if col in valid_columns and col in columns
            ]
            if len(fixed_columns) < len(columns):
                app.logger.warn(
                    "Ignoring invalid columns from request: {}".format(
                        columns ^ set(fixed_columns)
                    )
                )
            agg_df = agg_df.loc[:, fixed_columns]

        csv_data = agg_df.to_csv(encoding="utf-8", index=False)

        response = Response(csv_data, mimetype="text/csv")
        response.headers.set(
            "Content-Disposition",
            "attachment",
            filename="{}_wise_report.csv".format(type[:-1]),
        )
        return response
    else:
        app.logger.error(
            "Only 'text/csv' and 'application/json' HTTP accept headers supported"
        )
        abort(
            406, "Only 'text/csv' and 'application/json' HTTP accept headers supported"
        )
