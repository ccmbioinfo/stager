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


def add_json_content_header(kwargs: dict):
    """helper method for injecting content-type: json into headers"""
    headers = kwargs.pop("headers", {})
    headers["Content-Type"] = "application/json"
    kwargs["headers"] = headers
    return kwargs


class TestClient(FlaskClient):
    """ Class that adds 2 convenience methods for testing routes constrained by json content-type """

    def patch_json(self, *args, **kwargs):
        """ add content-type: json to patch request """
        return super().patch(*args, **add_json_content_header(kwargs))

    def post_json(self, *args, **kwargs):
        """ add content-type: json to post request """
        return super().post(*args, **add_json_content_header(kwargs))


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
    application.test_client_class = TestClient
    with application.test_client() as test_client:
        with application.app_context():
            yield test_client

    # Teardown
    with application.app_context():
        db.drop_all()


@pytest.fixture
def test_database(client):

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

    pipeline_1 = Pipeline(pipeline_name="CRG", pipeline_version="1.2")
    db.session.add(pipeline_1)
    pipeline_2 = Pipeline(pipeline_name="CRE", pipeline_version="1.1")
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
        family_codename="A", created_by_id=admin.user_id, updated_by_id=admin.user_id
    )

    participant_1 = Participant(
        participant_codename="001",
        sex=Sex.Female,
        participant_type=ParticipantType.Proband,
        institution_id=1,
        created_by_id=admin.user_id,
        updated_by_id=admin.user_id,
    )
    family_a.participants.append(participant_1)

    sample_1 = TissueSample(
        tissue_sample_type=TissueSampleType.Blood,
        created_by_id=admin.user_id,
        updated_by_id=admin.user_id,
    )
    participant_1.tissue_samples.append(sample_1)

    dataset_1 = Dataset(
        dataset_type="WES",
        condition=DatasetCondition.Somatic,
        created_by_id=admin.user_id,
        updated_by_id=admin.user_id,
    )
    sample_1.datasets.append(dataset_1)

    dataset_2 = Dataset(
        dataset_type="WGS",
        condition=DatasetCondition.Somatic,
        created_by_id=admin.user_id,
        updated_by_id=admin.user_id,
    )
    dataset_2.groups.append(group)
    sample_1.datasets.append(dataset_2)

    participant_2 = Participant(
        participant_codename="002",
        sex=Sex.Female,
        participant_type=ParticipantType.Parent,
        institution_id=1,
        created_by_id=admin.user_id,
        updated_by_id=admin.user_id,
    )
    family_a.participants.append(participant_2)

    sample_2 = TissueSample(
        tissue_sample_type=TissueSampleType.Blood,
        created_by_id=admin.user_id,
        updated_by_id=admin.user_id,
    )
    participant_2.tissue_samples.append(sample_2)

    dataset_3 = Dataset(
        dataset_type="WES",
        condition=DatasetCondition.Somatic,
        created_by_id=admin.user_id,
        updated_by_id=admin.user_id,
    )
    dataset_3.groups.append(group)
    sample_2.datasets.append(dataset_3)

    analysis_1 = Analysis(
        analysis_state=AnalysisState.Requested,
        requester_id=admin.user_id,
        assignee_id=admin.user_id,
        updated_by_id=admin.user_id,
        pipeline_id=pipeline_1.pipeline_id,
        requested="2020-07-28",
        started="2020-08-04",
        updated="2020-08-04",
    )
    dataset_1.analyses.append(analysis_1)
    dataset_3.analyses.append(analysis_1)

    analysis_2 = Analysis(
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
        family_codename="B", created_by_id=admin.user_id, updated_by_id=admin.user_id
    )

    participant_3 = Participant(
        participant_codename="003",
        sex=Sex.Male,
        participant_type=ParticipantType.Proband,
        institution_id=2,
        created_by_id=admin.user_id,
        updated_by_id=admin.user_id,
    )
    family_b.participants.append(participant_3)

    sample_3 = TissueSample(
        tissue_sample_type=TissueSampleType.Blood,
        created_by_id=admin.user_id,
        updated_by_id=admin.user_id,
    )
    participant_3.tissue_samples.append(sample_3)

    dataset_4 = Dataset(
        dataset_type="WGS",
        condition=DatasetCondition.Somatic,
        created_by_id=admin.user_id,
        updated_by_id=admin.user_id,
    )
    sample_3.datasets.append(dataset_4)

    analysis_3 = Analysis(
        analysis_state=AnalysisState.Requested,
        requester_id=admin.user_id,
        assignee_id=admin.user_id,
        updated_by_id=admin.user_id,
        pipeline_id=pipeline_1.pipeline_id,
        requested="2020-07-28",
        started="2020-08-04",
        updated="2020-08-04",
    )
    dataset_1.analyses.append(analysis_3)
    dataset_4.analyses.append(analysis_3)

    db.session.add(family_b)
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
