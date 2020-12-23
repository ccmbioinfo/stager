from datetime import datetime
import random

import click

from flask import current_app as app
from flask.cli import with_appcontext
from minio import Minio

from . import models
from .extensions import db
from .madmin import MinioAdmin, readwrite_buckets_policy


@click.command("add-default-admin")
@with_appcontext
def add_default_admin():
    if len(db.session.query(models.User).all()) == 0:
        default_admin = models.User(
            username=app.config.get("DEFAULT_ADMIN"),
            email=app.config.get("DEFAULT_ADMIN_EMAIL"),
            last_login=datetime.now(),
            is_admin=True,
            deactivated=False,
        )
        default_admin.set_password(app.config.get("DEFAULT_PASSWORD"))
        db.session.add(default_admin)
        db.session.commit()
        print(
            'Created default user "{}" with email "{}"'.format(
                default_admin.username, default_admin.email
            )
        )


@with_appcontext
def add_groups():
    if len(db.session.query(models.Group).all()) != 0:
        return
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
    # group code/name pairs 
    default_groups = {
        "c4r": "Care4Rare",
        "cheo": "Children's Hospital of Eastern Ontario",
        "bcch": "BC Children's Hospital",
        "ach": "Alberta Children's Hospital",
        "sch": "The Hospital for Sick Children",
    }

    for default_code, default_name in default_groups.items():
        policy = readwrite_buckets_policy(default_code)
        minio_admin.add_policy(default_code, policy)
        try:
            minio_client.make_bucket(default_code)
        except:
            print(f"MinIO bucket `{default_code}` already exists.")
        group = models.Group(group_code=default_code, group_name=default_name)
        db.session.add(group)

    db.session.commit()
    print("Created default groups with codes: {}".format(", ".join(default_groups)))


@with_appcontext
def add_default_users():
    if len(db.session.query(models.User).all()) != 1: # existing default admin 
        return
    for group in db.session.query(models.Group).all():
        default_user = models.User(
            username=f"{group.group_code}-user",
            email=f"user@test.{group.group_code}",
            last_login=datetime.now(),
            is_admin=False,
            deactivated=False
        )
        default_user.set_password(app.config.get("DEFAULT_PASSWORD"))
        default_user.minio_access_key = default_user.username
        default_user.groups.append(group)
        db.session.add(default_user)
        print(f'Created default user {default_user.username} in group {group.group_code}')

    db.session.commit()


@with_appcontext
def add_institutions():
    if len(db.session.query(models.Institution).all()) != 0:
        return
    institutions = [
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
        "Unknown",
    ]
    for i in institutions:
        db.session.add(models.Institution(institution=i))

    db.session.commit()

@with_appcontext
def add_dataset_types():
    if len(db.session.query(models.DatasetType).all()) == 0:
        dataset_types = [
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
        ]
        for d in dataset_types:
            db.session.add(models.DatasetType(dataset_type=d))

        db.session.commit()

    # add metadataset type
    if len(db.session.query(models.MetaDatasetType).all()) == 0:
        metadataset_types = ["Genome", "Exome", "RNA", "Other"]
        for m in metadataset_types:
            db.session.add(models.MetaDatasetType(metadataset_type=m))

        db.session.commit()

@with_appcontext
def add_pipelines():
    if len(db.session.query(models.Pipeline).all()) != 0:
        return
    default_pipelines = [
        {"pipeline_name": "CRG", "pipeline_version": "1.2"},
        {"pipeline_name": "CRE", "pipeline_version": "4.3"},
    ]
    for p in default_pipelines:
        pipeline = models.Pipeline(
            pipeline_name=p["pipeline_name"], pipeline_version=p["pipeline_version"]
        )
        db.session.add(pipeline)

    db.session.commit()
    print(
        "Created default pipelines: {}".format(
            ", ".join([p["pipeline_version"] for p in default_pipelines])
        )
    )


@with_appcontext
def add_supported_datasets():
    if len(db.session.query(models.PipelineDatasets).all()) != 0:
        return
    # genomic datasets map to pipeline_id 1 (CRG)
    db.session.add(
        models.PipelineDatasets(pipeline_id=1, supported_metadataset_type="Genome")
    )
    # exomic datasets map to pipeline_id 2 (CRE)
    db.session.add(
        models.PipelineDatasets(pipeline_id=2, supported_metadataset_type="Exome")
    )
    db.session.commit()
    print("Added dataset support info for pipelines")


@with_appcontext
def add_metadataset():
    if len(db.session.query(models.MetaDatasetType_DatasetType).all()) != 0:
        return
    for e in ["RES", "CES", "WES", "CPS", "RCS", "RDC", "RDE"]:
        db.session.add(
            models.MetaDatasetType_DatasetType(metadataset_type="Exome", dataset_type=e)
        )
    for g in ["RGS", "CGS", "WGS"]:
        db.session.add(
            models.MetaDatasetType_DatasetType(
                metadataset_type="Genome", dataset_type=g
            )
        )
    for o in ["RLM", "RMM", "RTA"]:
        db.session.add(
            models.MetaDatasetType_DatasetType(metadataset_type="Other", dataset_type=o)
        )

    db.session.add(
        models.MetaDatasetType_DatasetType(metadataset_type="RNA", dataset_type="RRS")
    )
    db.session.commit()
    print("Added metadataset_dataset information")



@with_appcontext
def add_data_hierarchies():
     if len(db.session.query(models.Family).all()) != 0:
        return
    family_code_iter = 2000
    participant_code_iter = 1
    for group in db.session.query(models.Group).all():
        institution = db.session.query(models.Institution.filter_by(institution=group.group_name).one_or_none())
        # create family per group
        default_family = models.Family(
            family_codename=str(family_code_iter),
            created_by_id=1,
            updated_by_id=1
        )
        # build trio
        for sex in ["-", "Female", "Male"]:
            participant = Participant(
                participant_codename=f'{upper(group.group_code)}{participant_code_iter:04}',
                institution_id=institution.institution_id,
                affected=True if sex == "-" else False,
                participant_type=ParticipantType.Proband if sex == "-" else ParticipantType.Parent,
                sex=getattr(Sex, random.choice(['Female','Male'])) if sex == "-" else getattr(Sex,sex),
                created_by_id=1,
                updated_by_id=1
            )
            default_family.participants.append(participant)
            participant_code_iter+=1
            tissue_sample = TissueSample(
                tissue_sample_type=TissueSampleType.Blood,
                created_by_id=1,
                updated_by_id=1
            )
            participant.tissue.append(tissue_sample)
            dataset = Dataset(
                dataset_type="RGS",
                entered=datetime.today().strftime('%Y-%m-%d'),
                condition="GermLine"
                updated_by_id=1,
                created_by_id=1,
            )
            dataset.groups.append(group)
            tissue_sample.datasets.append(dataset)

            #TODO: add analyses here

        db.session.add(default_family)
        db.session.flush()
        family_code_iter+=1


@click.command("add-default-data")
@with_appcontext
def add_default_data():
    add_groups()
    add_default_users()
    add_institutions()
    add_dataset_types()
    add_pipelines()
    add_supported_datasets()
    add_metadataset()
    add_data_hierarchies()