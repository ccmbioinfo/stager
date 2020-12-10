import os, pytest
from app import create_app, db
from app.config import Config
from app.models import *


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


@pytest.fixture(scope="class")
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
    group = Group(group_code="ach", group_name="Alberta")
    db.session.add(group)
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

    wes = DatasetType(dataset_type="WES")
    wgs = DatasetType(dataset_type="WGS")
    db.session.add(wes)
    db.session.add(wgs)
    db.session.flush()

    pipeline_1 = Pipeline(pipeline_name="CRG", pipeline_version="1.2")
    db.session.add(pipeline_1)
    db.session.flush()

    family_a = Family(
        family_codename="A", created_by=admin.user_id, updated_by=admin.user_id
    )

    participant_1 = Participant(
        participant_codename="001",
        sex=Sex.Female,
        participant_type=ParticipantType.Proband,
        created_by=admin.user_id,
        updated_by=admin.user_id,
    )
    family_a.participants.append(participant_1)

    sample_1 = TissueSample(
        tissue_sample_type=TissueSampleType.Blood,
        created_by=admin.user_id,
        updated_by=admin.user_id,
    )
    participant_1.tissue_samples.append(sample_1)

    dataset_1 = Dataset(
        dataset_type=wes.dataset_type,
        condition=DatasetCondition.Somatic,
        created_by=admin.user_id,
        updated_by=admin.user_id,
    )
    sample_1.datasets.append(dataset_1)

    dataset_2 = Dataset(
        dataset_type=wgs.dataset_type,
        condition=DatasetCondition.Somatic,
        created_by=admin.user_id,
        updated_by=admin.user_id,
    )
    dataset_2.groups.append(group)
    sample_1.datasets.append(dataset_2)

    participant_2 = Participant(
        participant_codename="002",
        sex=Sex.Female,
        participant_type=ParticipantType.Parent,
        created_by=admin.user_id,
        updated_by=admin.user_id,
    )
    family_a.participants.append(participant_2)

    sample_2 = TissueSample(
        tissue_sample_type=TissueSampleType.Blood,
        created_by=admin.user_id,
        updated_by=admin.user_id,
    )
    participant_2.tissue_samples.append(sample_2)

    dataset_3 = Dataset(
        dataset_type=wes.dataset_type,
        condition=DatasetCondition.Somatic,
        created_by=admin.user_id,
        updated_by=admin.user_id,
    )
    dataset_3.groups.append(group)
    sample_2.datasets.append(dataset_3)

    analysis_1 = Analysis(
        analysis_state=AnalysisState.Requested,
        requester=admin.user_id,
        assignee=admin.user_id,
        updated_by=admin.user_id,
        pipeline_id=pipeline_1.pipeline_id,
        requested="2020-07-28",
        started="2020-08-04",
        updated="2020-08-04",
    )
    dataset_1.analyses.append(analysis_1)
    dataset_3.analyses.append(analysis_1)

    analysis_2 = Analysis(
        analysis_state=AnalysisState.Requested,
        requester=admin.user_id,
        assignee=admin.user_id,
        updated_by=admin.user_id,
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
        family_codename="B", created_by=admin.user_id, updated_by=admin.user_id
    )

    participant_3 = Participant(
        participant_codename="003",
        sex=Sex.Male,
        participant_type=ParticipantType.Proband,
        created_by=admin.user_id,
        updated_by=admin.user_id,
    )
    family_b.participants.append(participant_3)

    sample_3 = TissueSample(
        tissue_sample_type=TissueSampleType.Blood,
        created_by=admin.user_id,
        updated_by=admin.user_id,
    )
    participant_3.tissue_samples.append(sample_3)

    dataset_4 = Dataset(
        dataset_type=wgs.dataset_type,
        condition=DatasetCondition.Somatic,
        created_by=admin.user_id,
        updated_by=admin.user_id,
    )
    sample_3.datasets.append(dataset_4)

    analysis_3 = Analysis(
        analysis_state=AnalysisState.Requested,
        requester=admin.user_id,
        assignee=admin.user_id,
        updated_by=admin.user_id,
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
    def login(identity: str) -> None:
        client.post("/api/logout", json={"useless": "why"})
        assert (
            client.post(
                "/api/login",
                json={"username": identity, "password": identity},
                follow_redirects=True,
            ).status_code
            == 200
        )

    return login
