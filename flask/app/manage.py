from datetime import datetime
import random

import click
from click.exceptions import ClickException

from flask import Flask, current_app as app
from flask.cli import with_appcontext
from minio import Minio
from sqlalchemy import and_

from .models import *
from .extensions import db
from .madmin import MinioAdmin, stager_buckets_policy

from .manage_keycloak import *
from .utils import stager_is_keycloak_admin

# for report mapping and insertion
from .mapping_utils import (
    get_report_paths,
    preprocess_report,
    get_analysis_ids,
    check_result_paths,
    try_int,
)
import pandas as pd
from app import models  # duplicated - how to best account for this
from sqlalchemy import exc
from pprint import pprint
import pickle
import gzip
import datetime


def register_commands(app: Flask) -> None:
    app.cli.add_command(seed_database)
    app.cli.add_command(seed_database_for_development)
    app.cli.add_command(seed_database_minio_groups)
    app.cli.add_command(update_analysis_pipelines)
    app.cli.add_command(map_insert_c4r_reports)
    if app.config.get("ENABLE_OIDC"):
        app.cli.add_command(update_user)
        if os.getenv("KEYCLOAK_HOST") is not None:
            app.cli.add_command(create_realm)
            app.cli.add_command(create_client)
            app.cli.add_command(add_user)


@click.command("map-insert-c4r-reports")
@click.argument("report_root_path")
@with_appcontext
def map_insert_c4r_reports(report_root_path) -> None:
    """
    Map dccforge C4R WES reports back to Stager, collapse datasets to a single analysis, and inserts reports

    In Stager's schema, an analysis can involve multiple datasets (which accurately reflects the real world), unfortunately this is not true
    for old SampleTracker, where an analysis is uniquely mapped to a single dataset. This script attempts to reconcile ST's 1:1 mapping with Stager's 1: many mapping.
    Without the 1: many mapping between analysis and datasets, the reports (and therefore variants) cannot be mapped back to an an analysis and their datasets.
    The script uses the report output and works backwards to best identify the participants and its datasets, collapses these analyses into a single analysis ID across datasets,
    then inserts the report (hopefully) matching the analysis.
    Assumptions and/or conditions that need to be met for a report (analysis) to be mapped back to Stager:
    - it is difficult, if not impossible to account for re-analyses so here the latest analysis is taken and assumed to be the corresponding report for a dataset
    - an analysis id must be present for the report ptp, tissue samples, datasets
    - the result path across participants datasets is primarily used to determine whether a report matches those individuals
        - across the datasets for a family, the analysis results path must either
            - end with .bam (meaning we can dirname the family)
            - end with the family dirname, eg. 2x/200. regardless the resulting dirname must be identical across the samples
            - contain ALL NONEs (rescues ~ 60 reports)
    - the number of participants in the reports matches the number of participants for the family in the db
    - participant and family aliases are accounted for but not if the participant codename =/= the sample name in the report
        - ie. the sample name matches the alias, not the participant_codename field in Stager, this currently affects 2 reports?
    If a report's family and samples matches the above condition, then
    - the analyses for the datasets under the family will be collapsed such that the same analysis id is given to the datasets involved in the analysis
    - inserts the report, variant by variant into the Variant table
    - updates the genotype for each dataset, for each analysis ,for each variant
    Currently maps ~1100 reports using a Stager production dump from 06-28-2021.
    """
    click.echo(report_root_path)

    report_paths = get_report_paths(results_path=report_root_path)
    app.logger.info("There are {} reports available".format(len(report_paths)))

    fam_dict = {}
    mappable_families = {}
    start = time.time()

    engine = db.session.get_bind()
    conn = engine.connect()

    app.logger.info("Deleting Genotype table..")
    models.Genotype.query.delete()
    db.session.commit()
    app.logger.info("Done")

    app.logger.info("Deleting Variant table..")
    models.Variant.query.delete()
    db.session.commit()
    app.logger.info("Done")

    mapped_inserted_reports = []

    for i, report in enumerate(report_paths):

        app.logger.info(report)
        if report in [
            "./results/9x/933R/933R.wes.2019-07-24.csv",
            "./results/4x/411/411.wes.2019-07-24.csv",
        ]:
            # stager has 141584 as ptp instead of CH0567 -> these reports match aliases but can't be subsetted as the sample name in report doesn't match the participant_codename
            continue

        # ---- obtain sample and family codenames from reports -----
        samples, df = preprocess_report(report)
        family_codename = str(os.path.basename(os.path.dirname(report)))

        pprint(samples)

        dataset_analysis_ids = get_analysis_ids(
            family_codename, samples, report, verbose=True
        )

        fam_dict[family_codename] = dataset_analysis_ids

        results_good, ends_in_fam_folder = check_result_paths(
            dataset_analysis_ids, samples, family_codename
        )

        if results_good:

            # if everything looks good the family will have their analyses collapsed

            pprint(fam_dict[family_codename])
            mappable_families[family_codename] = fam_dict[family_codename]

            family_analyses = [
                fam_dict[family_codename][ptps][0] for ptps in fam_dict[family_codename]
            ]  # first element is the analysis id to collapse towards
            dataset_ids = set(
                [
                    fam_dict[family_codename][ptps][3]
                    for ptps in fam_dict[family_codename]
                ]
            )

            pprint("Dataset IDs: {}".format(dataset_ids))

            # collapse each dataset - analysis to the same analysis
            for ptp in fam_dict[family_codename]:

                dataset_ptp_id = fam_dict[family_codename][ptp][3]
                analysis_ptp_id = fam_dict[family_codename][ptp][0]

                update_stmt = (
                    models.datasets_analyses_table.update()
                    .where(
                        (models.datasets_analyses_table.c.dataset_id == dataset_ptp_id)
                        & (
                            models.datasets_analyses_table.c.analysis_id
                            == analysis_ptp_id
                        )
                    )
                    .values(analysis_id=family_analyses[0])
                )

                conn.execute(update_stmt)
                db.session.flush()

            # ---- updating the result path -----
            # only update if the paths don't already end in the family folder eg. .../2x/216/
            if not all(ends_in_fam_folder):
                analysis_query = models.Analysis.query.filter(
                    models.Analysis.analysis_id == family_analyses[0]
                ).first()
                if analysis_query.result_path is not None:
                    pprint(analysis_query.result_path)
                    analysis_query.result_path = os.path.dirname(
                        analysis_query.result_path
                    )
                db.session.flush()
                pprint(analysis_query.result_path)
                print("\n")

            # --- inserting a variant -----
            # convert dataframe to a dict to iterate over
            # app.logger.debug(df.head(5))
            sample_dict = df.to_dict(orient="records")

            for i, row in enumerate(sample_dict):

                if i % 1000 == 0:
                    print("\t\t Variant # {}".format(str(i)))

                # ---- variant logic ----

                variant_obj = models.Variant(
                    analysis_id=family_analyses[0],
                    chromosome=row.get("chromosome"),
                    position=row.get("position"),
                    reference_allele=row.get("reference_allele"),
                    alt_allele=row.get("alt_allele"),
                    variation=row.get("variation"),
                    refseq_change=row.get("refseq_change"),
                    depth=row.get("depth"),
                    conserved_in_20_mammals=row.get("conserved_in_20_mammals"),
                    sift_score=row.get("sift_score"),
                    polyphen_score=row.get("polyphen_score"),
                    cadd_score=row.get("cadd_score"),
                    gnomad_af=row.get("gnomad_af"),
                    ucsc_link=row.get("ucsc_link"),
                    gnomad_link=row.get("gnomad_link"),
                    gene=row.get("gene"),
                    info=row.get("info"),
                    quality=row.get("quality"),
                    clinvar=row.get("clinvar"),
                    gnomad_af_popmax=row.get("gnomad_af_popmax"),
                    gnomad_ac=row.get("gnomad_ac"),
                    gnomad_hom=row.get("gnomad_hom"),
                    report_ensembl_gene_id=row.get("ensembl_gene_id"),
                    ensembl_transcript_id=row.get("ensembl_transcript_id"),
                    aa_position=row.get("aa_position"),
                    exon=row.get("exon"),
                    protein_domains=row.get("protein_domains"),
                    rsids=row.get("rsids"),
                    gnomad_oe_lof_score=row.get("gnomad_oe_lof_score"),
                    gnomad_oe_mis_score=row.get("gnomad_oe_mis_score"),
                    exac_pli_score=row.get("gnomad_oe_mis_score"),
                    exac_prec_score=row.get("exac_prec_score"),
                    exac_pnull_score=row.get("exac_pnull_score"),
                    spliceai_impact=row.get("spliceai_impact"),
                    spliceai_score=row.get("spliceai_score"),
                    vest3_score=row.get("vest3_score"),
                    revel_score=row.get("revel_score"),
                    gerp_score=row.get("gerp_score"),
                    imprinting_status=row.get("imprinting_status"),
                    imprinting_expressed_allele=row.get("imprinting_expressed_allele"),
                    pseudoautosomal=row.get("pseudoautosomal"),
                    number_of_callers=try_int(row.get("number_of_callers")),
                    old_multiallelic=row.get("old_multiallelic"),
                    uce_100bp=row.get("uce_100bp"),
                    uce_200bp=row.get("uce_200bp"),
                )

                db.session.add(variant_obj)
                db.session.flush()

                # convert to str incase it's a singleton
                gts_row = str(row.get("gts"))
                coverage_row = str(row.get("trio_coverage"))

                # assume the ordering of the samples in the columns matches these two fields
                if gts_row is not None:
                    gts_list = gts_row.split(",")

                if coverage_row is not None:
                    # replace forward slashes with underscores where applicable
                    coverage_row = coverage_row.replace("/", "_")
                    coverage_list = coverage_row.split("_")

                for i, sample in enumerate(samples):
                    # replaces family name and underscore prefixed to sample
                    sample_for_datasetid = str(
                        sample.replace(str(family_codename) + "_", "")
                    )
                    # if any underscores in the name they are dashes in the database, likely because of the R script used to generate the reports
                    sample_for_datasetid = sample_for_datasetid.replace("_", "-")

                    # get participant id from dict
                    dataset_ptp_id = None
                    dataset_ptp_id = fam_dict[family_codename][sample_for_datasetid][3]

                    gt_cols = [
                        "%s%s" % (col, sample)
                        for col in ["zygosity.", "burden.", "alt_depths."]
                    ]

                    zygosity, burden, alt_depths = [
                        row.get(col.lower()) for col in gt_cols
                    ]

                    analyzed_variant_dataset = models.Genotype(
                        variant_id=variant_obj.variant_id,
                        analysis_id=family_analyses[0],
                        dataset_id=dataset_ptp_id,
                        zygosity=zygosity,
                        burden=try_int(burden),
                        alt_depths=try_int(alt_depths),
                        coverage=try_int(coverage_list[i]),
                        genotype=gts_list[i],
                    )
                    db.session.add(analyzed_variant_dataset)

                try:
                    db.session.flush()
                #   db.session.commit()
                except exc.IntegrityError as e:
                    db.session.rollback()
                    app.logger.error(str(e))

        try:
            db.session.commit()
        except exc.IntegrityError as e:
            db.session.rollback()
            app.logger.error(str(e))

        mapped_inserted_reports.append(report)
        print("Done inserting %s" % report)
    db.session.commit()

    end = time.time()

    app.logger.info("Done inserting reports in {} minutes".format((end - start) / 60))
    app.logger.info("Mapped Families: {}".format(len(mappable_families)))
    app.logger.info("Total Families: {}".format(len(fam_dict)))

    # --- save down mapped reports as csv, a dictionary of dictionarys of mapped reports + metadata, and a dictionary of dictionaries of all families --
    current_date = datetime.date.today()

    pd.DataFrame(mapped_inserted_reports).to_csv(
        "./mapped_reports_{}.csv".format(current_date)
    )
    with gzip.open("./mapped_families_{}.p.gz".format(current_date), "wb") as handle:
        pickle.dump(mappable_families, handle, protocol=pickle.HIGHEST_PROTOCOL)

    with gzip.open("./all_families_{}.p.gz".format(current_date), "wb") as handle:
        pickle.dump(fam_dict, handle, protocol=pickle.HIGHEST_PROTOCOL)


@click.command("update-analysis-pipelines")
@with_appcontext
def update_analysis_pipelines() -> None:
    """
    A one-time command for associating analyses with the correct type of pipeline based on related dataset_type.
    Fixes a transposition that occurred during the migration from SampleTracker
    """
    should_be_crg2 = (
        Analysis.query.join(Dataset.analyses)
        .join(Analysis.pipeline)
        .filter(
            and_(
                Pipeline.pipeline_name == "cre",
                Dataset.dataset_type.in_(["RGS", "CGS", "WGS"]),
            )
        )
        .all()
    )

    should_be_cre = (
        Analysis.query.join(Dataset.analyses)
        .join(Analysis.pipeline)
        .filter(
            and_(
                Pipeline.pipeline_name == "crg2",
                Dataset.dataset_type.in_(["RES", "CES", "WES", "CPS", "RCS"]),
            )
        )
        .all()
    )

    configs = [
        ("cre", should_be_cre),
        ("crg2", should_be_crg2),
    ]

    for config in configs:

        new_pipeline_name, analyses = config

        new_pipeline_id = (
            Pipeline.query.filter(Pipeline.pipeline_name == new_pipeline_name)
            .first()
            .pipeline_id
        )

        """
        This is not the fastest or nicest way to do this, but the only way to override the onupdate setting on models.Analysis
        seems to be passing in the the model's own current `updated` value. Otherwise sqlalchemy would touch the `updated` timestamp for each analysis.
        # https://docs.sqlalchemy.org/en/14/core/defaults.html#metadata-defaults
        """
        for analysis in analyses:
            Analysis.query.filter(Analysis.analysis_id == analysis.analysis_id).update(
                {"pipeline_id": new_pipeline_id, "updated": analysis.updated},
                synchronize_session=False,
            )

        db.session.commit()

        app.logger.info(
            f"Updated analyses ids: {[a.analysis_id for a in analyses]} to {new_pipeline_name} pipeline"
        )


@click.command("db-seed")
@click.option("--force", is_flag=True, default=False)
@with_appcontext
def seed_database(force: bool) -> None:
    seed_default_admin(force)
    seed_institutions(force)
    seed_dataset_types(force)
    seed_pipelines(force)
    db.session.commit()


@click.command("db-seed-dev")
@click.option("--force", is_flag=True, default=False)
@with_appcontext
def seed_database_for_development(force: bool) -> None:
    if stager_is_keycloak_admin():
        setup_keycloak()
    seed_default_admin(force)
    seed_institutions(force)
    seed_dataset_types(force)
    seed_pipelines(force)
    db.session.flush()
    seed_dev_groups_and_users(force)
    seed_dev_data(force)
    db.session.commit()


@click.command("db-minio-seed-groups")
@click.option("--force", is_flag=True, default=False)
@with_appcontext
def seed_database_minio_groups(force: bool) -> None:
    seed_dev_groups_and_users(force, True)
    db.session.commit()


def seed_default_admin(force: bool) -> None:
    if force or User.query.count() == 0:
        default_admin = User(
            username=app.config.get("DEFAULT_ADMIN"),
            email=app.config.get("DEFAULT_ADMIN_EMAIL"),
            is_admin=True,
            deactivated=False,
        )
        password = app.config.get("DEFAULT_PASSWORD")
        default_admin.set_password(password)
        if stager_is_keycloak_admin():
            access_token = obtain_admin_token()
            if access_token:
                add_keycloak_user(access_token, default_admin, password)
        db.session.add(default_admin)
        app.logger.info(
            f'Created default admin "{default_admin.username}" with email "{default_admin.email}"'
        )


def seed_institutions(force: bool) -> None:
    if force or Institution.query.count() == 0:
        for institution in [
            "Alberta Children's Hospital",
            "BC Children's Hospital",
            "Children's Hospital of Eastern Ontario",
            "CHU Ste-Justine",
            "Credit Valley Hospital",
            "Hamilton Health Sciences Centre",
            "Health Sciences North",
            "International",
            "IWK Health Centre",
            "Kingston Health Sciences Centre",
            "London Health Sciences Centre",
            "Montreal Children's Hospital",
            "Mount Sinai Hospital",
            "North York General Hospital",
            "Saskatoon Health Region",
            "Stollery Children's Hospital",
            "The Hospital for Sick Children",
            "The Ottawa Hospital",
            "University Health Network",
            "Winnipeg Regional Health",
        ]:
            db.session.add(Institution(institution=institution))
        app.logger.info("Inserted institutions")


def seed_dataset_types(force: bool) -> None:
    if force or (DatasetType.query.count() == 0 and MetaDatasetType.query.count() == 0):
        for dataset_type in [
            "RES",  # Research Exome Sequencing
            "CES",  # Clinical Exome Sequencing
            "WES",  # Whole Exome Sequencing
            "CPS",  # Clinical Panel Sequencing
            "RCS",  # Research Clinome Sequencing
            "RDC",  # Research Deep Clinome Sequencing
            "RDE",  # Research Deep Exome Sequencing
            "RGS",  # Research Genome Sequencing
            "CGS",  # Clinical Genome Sequencing
            "WGS",  # Whole Genome Sequencing
            "RRS",  # Research RNA Sequencing
            "RLM",  # Research Lipidomics Mass Spectrometry
            "RMM",  # Research Metabolomics Mass Spectrometry
            "RTA",  # Research DNA Methylation array
        ]:
            db.session.add(DatasetType(dataset_type=dataset_type))

        for metadataset_type in ["Genome", "Exome", "RNA", "Other"]:
            db.session.add(MetaDatasetType(metadataset_type=metadataset_type))
        db.session.flush()

        for e in ["RES", "CES", "WES", "CPS", "RCS", "RDC", "RDE"]:
            db.session.add(
                MetaDatasetType_DatasetType(metadataset_type="Exome", dataset_type=e)
            )
        for g in ["RGS", "CGS", "WGS"]:
            db.session.add(
                MetaDatasetType_DatasetType(metadataset_type="Genome", dataset_type=g)
            )
        for o in ["RLM", "RMM", "RTA"]:
            db.session.add(
                MetaDatasetType_DatasetType(metadataset_type="Other", dataset_type=o)
            )
        db.session.add(
            MetaDatasetType_DatasetType(metadataset_type="RNA", dataset_type="RRS")
        )
        app.logger.info("Inserted dataset types and meta-dataset types")


def seed_pipelines(force: bool) -> None:
    if force or Pipeline.query.count() == 0:
        crg2 = Pipeline(pipeline_name="crg2", pipeline_version="latest")
        db.session.add(crg2)
        cre = Pipeline(pipeline_name="cre", pipeline_version="latest")
        db.session.add(cre)
        dig2 = Pipeline(pipeline_name="dig2", pipeline_version="latest")
        db.session.add(dig2)
        db.session.flush()
        app.logger.info("Inserted pipelines")
        db.session.add(
            PipelineDatasets(
                pipeline_id=crg2.pipeline_id, supported_metadataset_type="Genome"
            )
        )
        db.session.add(
            PipelineDatasets(
                pipeline_id=cre.pipeline_id, supported_metadataset_type="Exome"
            )
        )
        db.session.add(
            PipelineDatasets(
                pipeline_id=dig2.pipeline_id, supported_metadataset_type="RNA"
            )
        )
        app.logger.info("Inserted supported meta-dataset types for pipelines")


def seed_dev_groups_and_users(force: bool, skip_users: bool = False) -> None:
    if force or (Group.query.count() == 0 and User.query.count() == 1):  # default admin
        minio_client = Minio(
            app.config["MINIO_ENDPOINT"],
            access_key=app.config["MINIO_ACCESS_KEY"],
            secret_key=app.config["MINIO_SECRET_KEY"],
            secure=False,
        )
        minio_admin = MinioAdmin(
            endpoint=app.config["MINIO_ENDPOINT"],
            access_key=app.config["MINIO_ACCESS_KEY"],
            secret_key=app.config["MINIO_SECRET_KEY"],
        )
        groups = {
            "c4r": "Care4Rare",
            "cheo": "Children's Hospital of Eastern Ontario",
            "bcch": "BC Children's Hospital",
            "ach": "Alberta Children's Hospital",
            "sch": "The Hospital for Sick Children",
        }
        for code, name in groups.items():
            policy = stager_buckets_policy(code)
            minio_admin.add_policy(code, policy)
            try:
                minio_client.make_bucket(
                    bucket_name=code, location=app.config["MINIO_REGION_NAME"]
                )
            except:
                app.logger.warn(f"MinIO bucket `{code}` already exists.")
            group = Group(group_code=code, group_name=name)
            db.session.add(group)

            if not skip_users:
                user = User(
                    username=f"{code}-user",
                    email=f"user@test.{code}",
                    is_admin=False,
                    deactivated=False,
                )
                password = code + "-" + app.config.get("DEFAULT_PASSWORD")
                user.set_password(password)
                if stager_is_keycloak_admin():
                    access_token = obtain_admin_token()
                    if access_token:
                        add_keycloak_user(access_token, user, password)
                user.groups.append(group)
                db.session.add(user)
                app.logger.info(f"Created user {user.username} in group {code}")

    # Add user unknown to Stager for testing
    if stager_is_keycloak_admin():
        user = User(
            username=f"unknown-user",
            email=f"user@unknown.com",
            is_admin=False,
            deactivated=False,
        )
        access_token = obtain_admin_token()
        if access_token:
            add_keycloak_user(access_token, user, "unknown")


def seed_dev_data(force: bool) -> None:
    if not force and Family.query.count() != 0:
        return
    family_code_iter = 2000
    participant_code_iter = 1
    c4r_group = Group.query.filter_by(group_code="c4r").one()
    for group in Group.query.filter(Group.group_code != "c4r").all():
        institution = Institution.query.filter_by(
            institution=group.group_name
        ).one_or_none()
        # default to CHEO for unknown
        if not institution:
            cheo = "Children's Hospital of Eastern Ontario"
            institution = Institution.query.filter_by(institution=cheo).one_or_none()

        # create family per group
        default_family = Family(
            family_codename=str(family_code_iter), created_by_id=1, updated_by_id=1
        )
        # one analysis per trio
        analysis = Analysis(
            analysis_state=AnalysisState.Requested,
            pipeline_id=1,  # CRG
            assignee_id=1,
            requester_id=1,
            requested=datetime.now(),
            updated=datetime.now(),
            updated_by_id=1,
        )
        # build trio
        for sex in ["-", "Female", "Male"]:
            participant = Participant(
                participant_codename=f"{group.group_code.upper()}{participant_code_iter:04}",
                institution_id=institution.institution_id,
                affected=True if sex == "-" else False,
                participant_type=ParticipantType.Proband
                if sex == "-"
                else ParticipantType.Parent,
                sex=getattr(Sex, random.choice(["Female", "Male"]))
                if sex == "-"
                else getattr(Sex, sex),
                created_by_id=1,
                updated_by_id=1,
            )
            default_family.participants.append(participant)
            participant_code_iter += 1
            tissue_sample = TissueSample(
                tissue_sample_type=TissueSampleType.Blood,
                created_by_id=1,
                updated_by_id=1,
            )
            participant.tissue_samples.append(tissue_sample)
            gdataset = Dataset(
                dataset_type="RGS",
                created=datetime.now(),
                condition="GermLine",
                updated_by_id=1,
                created_by_id=1,
            )
            edataset = Dataset(
                dataset_type="RES",
                created=datetime.now(),
                condition="GermLine",
                updated_by_id=1,
                created_by_id=1,
            )
            gdataset.groups += [group, c4r_group]
            edataset.groups += [group, c4r_group]
            tissue_sample.datasets += [gdataset, edataset]
            gdataset.analyses.append(analysis)

        db.session.add(default_family)
        family_code_iter += 1


@click.command("update-user")
@click.argument("username", required=True, type=str)
@click.option("--issuer", help="OAuth issuer claim (OAuth provider URL)")
@click.option("--subject", help="OAuth subject claim (OAuth provider user ID)")
@with_appcontext
def update_user(username, issuer, subject):
    """Update OAuth fields for user USERNAME."""
    user = User.query.filter_by(username=username).first()
    if user is None:
        raise ClickException("Username not found")

    if issuer:
        user.issuer = issuer

    if subject:
        user.subject = subject

    try:
        db.session.commit()
    except Exception as error:
        db.session.rollback()
        raise error
