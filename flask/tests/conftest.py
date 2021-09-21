import os

import pytest
from app import create_app, db
from app.config import Config
from app.models import *
from flask.testing import FlaskClient


class TestConfig(Config):
    """
    Pytest config settings.
    Uses MySQL database called "st2020testing" for adding/removing test data.
    """

    FLASK_ENV = "development"
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "TEST_ST_DATABASE_URI", "mysql+pymysql://admin:admin@localhost/st2020testing"
    )
    SQLALCHEMY_LOG = False
    MINIO_ENDPOINT = os.getenv("TEST_MINIO_ENDPOINT", "localhost:9000")
    MINIO_SECRET_KEY = os.getenv(
        "TEST_MINIO_SECRET_KEY", "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
    )
    MINIO_ACCESS_KEY = os.getenv("TEST_MINIO_ACCESS_KEY", "AKIAIOSFODNN7EXAMPLE")
    MINIO_REGION_NAME = os.getenv("MINIO_REGION_NAME", "hpc4health")
    ENABLE_OIDC = os.getenv("ENABLE_OIDC", "")
    TESTING = True
    LOGIN_DISABLED = False


@pytest.fixture(scope="session")
def application():
    """
    A test instance of the app.
    Will be reused for all tests.
    """
    test_app = create_app(TestConfig)
    yield test_app


@pytest.fixture
def client(application):
    """
    A test client that can issue requests.
    Will create a fresh empty db for every test.
    """

    # Setup
    with application.app_context():
        db.create_all()

    # Do the things
    with application.test_client() as test_client:
        with application.app_context():
            yield test_client

    # Teardown
    with application.app_context():
        db.drop_all()


@pytest.fixture
def test_database(client):
    # Update docs/flask.md if anything changes here
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
        db.session.add(Institution(institution=i))

    db.session.flush()

    dataset_types = [
        "RES",
        "CES",
        "WES",
        "CPS",
        "RCS",
        "RDC",
        "RDE",
        "RGS",
        "CGS",
        "WGS",
        "RRS",
        "RLM",
        "RMM",
        "RTA",
    ]

    for d in dataset_types:
        db.session.add(DatasetType(dataset_type=d))
    db.session.flush()

    metadataset_types = ["Genome", "Exome", "RNA", "Other"]

    for m in metadataset_types:
        db.session.add(MetaDatasetType(metadataset_type=m))
    db.session.flush()

    md_d = {
        "Exome": ["RES", "CES", "WES", "CPS", "RCS", "RDC", "RDE"],
        "Genome": ["RGS", "CGS", "WGS"],
        "Other": ["RLM", "RMM", "RTA"],
        "RNA": ["RRS"],
    }

    for k in md_d:
        for dataset in md_d[k]:
            db.session.add(
                MetaDatasetType_DatasetType(metadataset_type=k, dataset_type=dataset)
            )
    db.session.flush()

    group = Group(group_code="ach", group_name="Alberta")
    db.session.add(group)
    db.session.flush()

    group_bcch = Group(group_code="bcch", group_name="BC Children's Hospital")
    db.session.add(group_bcch)
    db.session.flush()

    admin = User(username="admin", email="noreply@sickkids.ca", is_admin=True)
    admin.set_password("admin")
    admin.minio_access_key = "admin"
    db.session.add(admin)
    db.session.flush()

    user = User(username="user", email="test@sickkids.ca")
    user.set_password("user")
    user.minio_access_key = "user"
    user.groups.append(group)
    db.session.add(user)
    db.session.flush()

    user_a = User(username="user_a", email="test_a@sickkids.ca")
    user_a.set_password("user_a")
    user_a.minio_access_key = "user_a"
    user_a.groups.append(group)
    user_a.groups.append(group_bcch)
    db.session.add(user_a)
    db.session.flush()

    user_b = User(username="user_b", email="test_b@sickkids.ca")
    user_b.set_password("user_b")
    user_b.minio_access_key = "user_b"
    db.session.add(user_b)
    db.session.flush()

    pipeline_1 = Pipeline(pipeline_id=1, pipeline_name="CRG", pipeline_version="1.2")
    db.session.add(pipeline_1)
    pipeline_2 = Pipeline(pipeline_id=2, pipeline_name="CRE", pipeline_version="1.1")
    db.session.add(pipeline_2)
    db.session.flush()

    db.session.add(
        PipelineDatasets(
            pipeline_id=pipeline_1.pipeline_id, supported_metadataset_type="Genome"
        )
    )
    db.session.add(
        PipelineDatasets(
            pipeline_id=pipeline_2.pipeline_id, supported_metadataset_type="Exome"
        )
    )
    db.session.flush()

    family_a = Family(
        family_id=1,
        family_codename="Aa",
        created_by_id=admin.user_id,
        updated_by_id=admin.user_id,
    )

    participant_1 = Participant(
        participant_id=1,
        participant_codename="001",
        sex=Sex.Female,
        participant_type=ParticipantType.Proband,
        institution_id=1,
        created_by_id=admin.user_id,
        updated_by_id=admin.user_id,
    )
    family_a.participants.append(participant_1)

    sample_1 = TissueSample(
        tissue_sample_id=1,
        tissue_sample_type=TissueSampleType.Blood,
        created_by_id=admin.user_id,
        updated_by_id=admin.user_id,
    )
    participant_1.tissue_samples.append(sample_1)

    dataset_1 = Dataset(
        dataset_id=1,
        dataset_type="WES",
        condition=DatasetCondition.Somatic,
        created_by_id=admin.user_id,
        updated_by_id=admin.user_id,
        sequencing_id="5",
    )
    sample_1.datasets.append(dataset_1)

    dataset_2 = Dataset(
        dataset_id=2,
        dataset_type="WGS",
        condition=DatasetCondition.Somatic,
        created_by_id=admin.user_id,
        updated_by_id=admin.user_id,
        sequencing_id="4",
    )
    dataset_2.groups.append(group)
    sample_1.datasets.append(dataset_2)

    participant_2 = Participant(
        participant_id=2,
        participant_codename="002",
        sex=Sex.Female,
        participant_type=ParticipantType.Parent,
        institution_id=1,
        created_by_id=admin.user_id,
        updated_by_id=admin.user_id,
    )
    family_a.participants.append(participant_2)

    sample_2 = TissueSample(
        tissue_sample_id=2,
        tissue_sample_type=TissueSampleType.Blood,
        created_by_id=admin.user_id,
        updated_by_id=admin.user_id,
    )
    participant_2.tissue_samples.append(sample_2)

    dataset_3 = Dataset(
        dataset_id=3,
        dataset_type="WGS",
        condition=DatasetCondition.Somatic,
        created_by_id=admin.user_id,
        updated_by_id=admin.user_id,
        sequencing_id="3",
    )
    dataset_3.groups.append(group)
    sample_2.datasets.append(dataset_3)

    analysis_1 = Analysis(
        analysis_id=1,
        analysis_state=AnalysisState.Requested,
        requester_id=admin.user_id,
        assignee_id=admin.user_id,
        updated_by_id=admin.user_id,
        pipeline_id=pipeline_2.pipeline_id,
        requested="2020-07-28",
        started="2020-08-04",
        updated="2020-08-04",
    )
    dataset_1.analyses.append(analysis_1)

    analysis_2 = Analysis(
        analysis_id=2,
        analysis_state=AnalysisState.Requested,
        requester_id=admin.user_id,
        assignee_id=admin.user_id,
        updated_by_id=admin.user_id,
        pipeline_id=pipeline_1.pipeline_id,
        requested="2020-07-28",
        started="2020-08-04",
        updated="2020-08-04",
    )
    dataset_2.analyses.append(analysis_2)
    dataset_3.analyses.append(analysis_2)

    db.session.add(family_a)
    db.session.flush()

    family_b = Family(
        family_id=2,
        family_codename="Bb",
        created_by_id=admin.user_id,
        updated_by_id=admin.user_id,
    )

    participant_3 = Participant(
        participant_id=3,
        participant_codename="003",
        sex=Sex.Male,
        participant_type=ParticipantType.Proband,
        institution_id=2,
        created_by_id=admin.user_id,
        updated_by_id=admin.user_id,
    )
    family_b.participants.append(participant_3)

    sample_3 = TissueSample(
        tissue_sample_id=3,
        tissue_sample_type=TissueSampleType.Blood,
        created_by_id=admin.user_id,
        updated_by_id=admin.user_id,
    )
    participant_3.tissue_samples.append(sample_3)

    dataset_4 = Dataset(
        dataset_id=4,
        dataset_type="WES",
        condition=DatasetCondition.Somatic,
        created_by_id=admin.user_id,
        updated_by_id=admin.user_id,
        sequencing_id="2",
    )
    sample_3.datasets.append(dataset_4)

    analysis_3 = Analysis(
        analysis_id=3,
        analysis_state=AnalysisState.Requested,
        requester_id=admin.user_id,
        assignee_id=admin.user_id,
        updated_by_id=admin.user_id,
        pipeline_id=pipeline_2.pipeline_id,
        requested="2020-07-28",
        started="2020-08-04",
        updated="2020-08-04",
    )
    dataset_1.analyses.append(analysis_3)
    dataset_4.analyses.append(analysis_3)

    # Creating a test dataset with tissue samples but no analysis
    dataset_5 = Dataset(
        dataset_id=5,
        dataset_type="WES",
        condition=DatasetCondition.Somatic,
        created_by_id=admin.user_id,
        updated_by_id=admin.user_id,
    )

    # Creating a tissue sample with only one dataset
    sample_4 = TissueSample(
        tissue_sample_id=4,
        tissue_sample_type=TissueSampleType.Blood,
        created_by_id=admin.user_id,
        updated_by_id=admin.user_id,
    )
    sample_4.datasets.append(dataset_5)
    participant_3.tissue_samples.append(sample_4)

    db.session.add(family_b)
    db.session.commit()

    # gene viewer

    # ensg, chromosome, start, end, gene
    genes = [
        (138131, "10", 100_007_447, 100_027_951, "LOXL4"),
        (258366, "20", 62_289_163, 62_327_606, "RTEL1"),
    ]
    # variants
    positions = {
        "LOXL4": [("10", 100010909), ("10", 100016572), ("10", 100016632)],
        "RTEL1": [("20", 62326518), ("20", 62326938), ("20", 62327126)],
    }
    reference_alleles = {"LOXL4": ["C", "G", "G"], "RTEL1": ["C", "G", "C"]}

    alt_alleles = {"LOXL4": ["T", "C", "A"], "RTEL1": ["A", "C", "G"]}
    variations = {
        "LOXL4": ["missense_variant", "missense_variant", "missense_variant"],
        "RTEL1": ["missense_variant", "missense_variant", "splice_region_variant"],
    }

    refseq_changes = {
        "LOXL4": [
            "NM_032211.6:c.2113G>A:p.Val705Met",
            "NM_032211.6:c.1393C>G:p.Gln465Glu",
            "NM_032211.6:c.1333C>T:p.Arg445Cys",
        ],
        "RTEL1": [
            "NM_001283009.1:c.3443C>A:p.Pro1148His",
            "NM_001283009.2:c.3757G>C:p.Val1253Leu",
            None,
        ],
    }

    depths = {"LOXL4": [377, 634, 295], "RTEL1": [355, 288, 122]}
    conserved_in_20_mammals = {
        "LOXL4": [0.935, 0.953, 0.53],
        "RTEL1": [0.848, 0.953, None],
    }
    sift_scores = {
        "LOXL4": [0.16, 0.02, 0.03],
        "RTEL1": [0.01, 0.10, None],
    }
    polyphen_scores = {
        "LOXL4": [0.730, 0.998, 0.964],
        "RTEL1": [0.847, 0.991, None],
        "RTEL1": [0.847, 0.991, None],
    }

    cadd_scores = {
        "LOXL4": [25.2, 27.1, 34.0],
        "RTEL1": [23.6, 24.5, None],
    }
    gnomad_afs = {
        "LOXL4": [0.000585, 0.000217, 0.000285],
        "RTEL1": [0.000011, 0, 0.002722],
    }
    # ds 1,4, - analysis 3
    # ds2,3 - analysis 2///ach//user
    datasets_gt = {
        dataset_2.dataset_id: {
            "LOXL4": {
                "zygosity": ["Het", "Hom", "-"],
                "burden": [1, 0, 1],
                "alt_depths": [500, 222, 0],
            },
            "RTEL1": {
                "zygosity": ["Het", "-", "-"],
                "burden": [1, 0, 1],
                "alt_depths": [500, 0, 0],
            },
        },
        dataset_3.dataset_id: {
            "LOXL4": {
                "zygosity": ["Het", "Het", "Het"],
                "burden": [1, 0, 1],
                "alt_depths": [63, 455, 0],
            },
            "RTEL1": {
                "zygosity": ["Het", "Het", "Hom"],
                "burden": [1, 0, 1],
                "alt_depths": [88, 655, 111],
            },
        },
    }

    for ensg, chromosome, start, end, gene in genes:
        gene_obj = Gene(ensembl_id=ensg, chromosome=chromosome, start=start, end=end)
        db.session.add(gene_obj)
        db.session.flush()
        db.session.add(GeneAlias(ensembl_id=ensg, name=gene))
        db.session.flush()

        # variant logic for analysis_3
        for i in range(len(positions["LOXL4"])):
            variant_obj = Variant(
                analysis_id=analysis_2.analysis_id,
                chromosome=positions[gene][i][0],
                position=positions[gene][i][1],
                reference_allele=reference_alleles[gene][i],
                alt_allele=alt_alleles[gene][i],
                variation=variations[gene][i],
                refseq_change=refseq_changes[gene][i],
                depth=depths[gene][i],
                conserved_in_20_mammals=conserved_in_20_mammals[gene][i],
                sift_score=sift_scores[gene][i],
                polyphen_score=polyphen_scores[gene][i],
                cadd_score=cadd_scores[gene][i],
                gnomad_af=gnomad_afs[gene][i],
            )
            db.session.add(variant_obj)
            db.session.flush()

            for dataset_id in datasets_gt:
                gt_obj = Genotype(
                    variant_id=variant_obj.variant_id,
                    analysis_id=analysis_2.analysis_id,
                    dataset_id=dataset_id,
                    zygosity=datasets_gt[dataset_id][gene]["zygosity"][i],
                    burden=datasets_gt[dataset_id][gene]["burden"][i],
                    alt_depths=datasets_gt[dataset_id][gene]["alt_depths"][i],
                )
                db.session.add(gt_obj)
                db.session.flush()
    db.session.commit()


@pytest.fixture
def login_as(client):
    def login(username: str, password: str = None) -> None:
        password = password or username
        client.post("/api/logout", json={"useless": "why"})
        assert (
            client.post(
                "/api/login",
                json={"username": username, "password": password},
                follow_redirects=True,
            ).status_code
            == 200
        )

    return login
