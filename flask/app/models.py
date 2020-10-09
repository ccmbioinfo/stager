from dataclasses import dataclass
from datetime import datetime, date
from enum import Enum
from typing import List
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy import CheckConstraint

from app import db


class User(UserMixin, db.Model):
    user_id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(30), nullable=False, unique=True)
    password_hash = db.Column(db.String(200), nullable=False, unique=False)
    email = db.Column(db.String(150), nullable=False, unique=True)
    is_admin = db.Column(db.Boolean, unique=False, default=False)
    last_login = db.Column(db.DateTime)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password, method='pbkdf2:sha256:50000')

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def get_id(self):
        return self.user_id


@dataclass
class Group(db.Model):
    group_id: int = db.Column(db.Integer, primary_key=True)
    group_code: str = db.Column(db.String(50), nullable=False, unique=True) # i.e. CHEO, SK, AB
    group_name: str = db.Column(db.String(250), nullable=False, unique=True) # full group name


@dataclass
class Family(db.Model):
    family_id: int = db.Column(db.Integer, primary_key=True)
    # Family.FamilyID
    family_codename: str = db.Column(db.String(50), nullable=False, unique=True)
    created: str = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    created_by: int = db.Column(db.Integer, db.ForeignKey('user.user_id', onupdate='cascade'), nullable=False)
    updated: str = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    updated_by: int = db.Column(db.Integer, db.ForeignKey('user.user_id', onupdate='cascade'), nullable=False)
    participants = db.relationship('Participant', backref='family')


class Sex(str, Enum):
    Male = 'Male'
    Female = 'Female'
    Other = 'Other'


class ParticipantType(str, Enum):
    Proband = 'Proband'
    Mother = 'Mother'
    Father = 'Father'
    Sibling = 'Sibling'


@dataclass
class Participant(db.Model):
    participant_id: int = db.Column(db.Integer, primary_key=True)
    family_id = db.Column(db.Integer, db.ForeignKey('family.family_id'), nullable=False)
    # Sample.SampleName
    participant_codename: str = db.Column(db.String(50), nullable=False, unique=True)
    # Sample.Gender
    sex: Sex = db.Column(db.Enum(Sex), nullable=False)
    # Sample.SampleType
    participant_type: ParticipantType = db.Column(db.Enum(ParticipantType), nullable=False)
    month_of_birth: date = db.Column(db.Date, CheckConstraint('DAY(month_of_birth) = 1'))
    # Sample.AffectedStatus
    affected: bool = db.Column(db.Boolean)
    # Dataset.SolvedStatus
    solved: bool = db.Column(db.Boolean) #TODO uncomment and rebuild
    notes: str = db.Column(db.Text)
    created: datetime = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    created_by: int = db.Column(db.Integer, db.ForeignKey('user.user_id', onupdate='cascade'), nullable=False)
    updated: datetime = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    updated_by: int = db.Column(db.Integer, db.ForeignKey('user.user_id', onupdate='cascade'), nullable=False)
    tissue_samples = db.relationship('TissueSample', backref='participant')


class TissueSampleType(str, Enum):
    Blood = 'Blood'  # BLO
    Saliva = 'Saliva'  # SAL
    Lymphocyte = 'Lymphocyte'  # LYM
    Fibroblast = 'Fibroblast'  # FIB
    Muscle = 'Muscle'  # MUS
    Skin = 'Skin'  # SKI
    Urine = 'Urine'  # URI
    Plasma = 'Plasma'  # PLA
    Unknown = 'Unknown'  # UNK
    Kidney = 'Kidney'  # KID


class TissueProcessing(str, Enum):
    FreshFrozen = 'FF'
    Formaldehyde = 'FFPE'


@dataclass
class TissueSample(db.Model):
    tissue_sample_id: int = db.Column(db.Integer, primary_key=True)
    participant_id: int = db.Column(db.Integer, db.ForeignKey('participant.participant_id'), nullable=False)
    extraction_date: datetime = db.Column(db.Date)
    # Sample.TissueType
    tissue_sample_type: TissueSampleType = db.Column(db.Enum(TissueSampleType), nullable=False)
    # RNASeqDataset.TissueProcessing
    tissue_processing: TissueProcessing = db.Column(db.Enum(TissueProcessing))
    notes: str = db.Column(db.Text)
    created: datetime = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    created_by: int = db.Column(db.Integer, db.ForeignKey('user.user_id', onupdate='cascade'), nullable=False)
    updated: datetime = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.now)
    updated_by: int = db.Column(db.Integer, db.ForeignKey('user.user_id', onupdate='cascade'), nullable=False)
    datasets = db.relationship('Dataset', backref='tissue_sample')


class DatasetType(str, Enum):
    CES = 'CES'
    CGS = 'CGS'
    CPS = 'CPS'
    RES = 'RES'
    RGS = 'RGS'
    RLM = 'RLM'
    RMM = 'RMM'
    RRS = 'RRS'
    RTA = 'RTA'
    WES = 'WES'
    WGS = 'WGS'
    RNASeq = 'RNASeq'  # RNA-Seq
    RCS = 'RCS'
    RDC = 'RDC'
    RDE = 'RDE'


# Name TBD
class DatasetCondition(str, Enum):
    Control = 'Control'
    GermLine = 'GermLine'  # e.g. rare diseases
    Somatic = 'Somatic'  # e.g. cancer


class DatasetExtractionProtocol(str, Enum):
    Something = 'Something'


class DatasetReadType(str, Enum):
    PairedEnd = 'PairedEnd'
    SingleEnd = 'SingleEnd'


users_groups_table = db.Table(
    'users_groups', db.Model.metadata,
    db.Column('user_id', db.Integer, db.ForeignKey('user.user_id')),
    db.Column('group_id', db.Integer, db.ForeignKey('group.group_id'))
)


groups_datasets_table = db.Table(
    'groups_datasets', db.Model.metadata,
    db.Column('group_id', db.Integer, db.ForeignKey('group.group_id')),
    db.Column('dataset_id', db.Integer, db.ForeignKey('dataset.dataset_id'))
)


datasets_analyses_table = db.Table(
    'datasets_analyses', db.Model.metadata,
    db.Column('dataset_id', db.Integer, db.ForeignKey('dataset.dataset_id')),
    db.Column('analysis_id', db.Integer, db.ForeignKey('analysis.analysis_id'))
)


@dataclass
class Dataset(db.Model):
    __tablename__ = 'dataset'
    tissue_sample_id: int = db.Column(db.Integer, db.ForeignKey('tissue_sample.tissue_sample_id'), nullable=False)
    # Dataset.DatasetID
    dataset_id: int = db.Column(db.Integer, primary_key=True)
    # Dataset.DatasetType
    dataset_type: DatasetType = db.Column(db.Enum(DatasetType), nullable=False)
    # Dataset.HPFPath
    input_hpf_path: str = db.Column(db.String(500))
    # Dataset.Notes
    notes: str = db.Column(db.Text)
    # RNASeqDataset.Condition (name TBD)
    condition: DatasetCondition = db.Column(db.Enum(DatasetCondition), nullable=False)
    extraction_protocol: DatasetExtractionProtocol = db.Column(db.Enum(DatasetExtractionProtocol))
    # RNASeqDataset.ExtractionMethod (guided dropdown or enum)
    capture_kit: str = db.Column(db.String(50))
    # RNASeq.LibraryPrepMethod (guided dropdown or enum)
    library_prep_method: str = db.Column(db.String(50))
    library_prep_date: datetime = db.Column(db.Date)
    read_length: int = db.Column(db.Integer)
    read_type: DatasetReadType = db.Column(db.Enum(DatasetReadType))
    sequencing_id: str = db.Column(db.String(50))
    sequencing_date: datetime = db.Column(db.Date)
    # Uploaders.UploadCenter
    sequencing_centre: str = db.Column(db.String(100))
    batch_id: str = db.Column(db.String(50))
    created: datetime = db.Column(db.DateTime, default=datetime.utcnow)
    created_by: int = db.Column(db.Integer, db.ForeignKey('user.user_id', onupdate='cascade'), nullable=False)
    # Dataset.NotesLastUpdatedDate
    updated: datetime = db.Column(db.DateTime, nullable=False, onupdate=datetime.now, default=datetime.utcnow)
    # Dataset.NotesLastUpdatedBy
    updated_by: int = db.Column(db.Integer, db.ForeignKey('user.user_id', onupdate='cascade'), nullable=False)

    discriminator = db.Column(db.Enum('dataset', 'rnaseq_dataset'))
    __mapper_args__ = {
        'polymorphic_identity': 'dataset',
        'polymorphic_on': discriminator
    }

    analyses = db.relationship('Analysis', secondary=datasets_analyses_table, backref='datasets')


@dataclass
class RNASeqDataset(Dataset):
    __tablename__ = 'rnaseq_dataset'
    dataset_id: int = db.Column(db.Integer,
                                db.ForeignKey('dataset.dataset_id', onupdate='cascade', ondelete='cascade'),
                                primary_key=True)
    # RNASeqDataset.RIN
    RIN: float = db.Column(db.Float)
    # RNASeqDataset.DV200
    DV200: int = db.Column(db.Integer)
    # RNASeqDataset.QubitRNAConcentration
    concentration: float = db.Column(db.Float)
    # RNASeqDataset.Sequencer (guided dropdown or enum)
    sequencer: str = db.Column(db.String(50))
    spike_in: str = db.Column(db.String(50))

    __mapper_args__ = {
        'polymorphic_identity': 'rnaseq_dataset'
    }


class AnalysisState(str, Enum):
    Requested = 'Requested'
    Running = 'Running'
    Done = 'Done'
    Error = 'Error'
    Cancelled = 'Cancelled'


@dataclass
class Analysis(db.Model):
    # Analysis.AnalysisID
    analysis_id: int = db.Column(db.Integer, primary_key=True)
    # AnalysisStatus.AnalysisStep
    analysis_state: AnalysisState = db.Column(db.Enum(AnalysisState), nullable=False)
    pipeline_id: int = db.Column(db.Integer,
                                 db.ForeignKey('pipeline.pipeline_id', onupdate='cascade', ondelete='restrict'),
                                 nullable=False)
    # Dataset.RunID
    qsub_id: int = db.Column(db.Integer)
    # Analysis.ResultsDirectory
    result_hpf_path: str = db.Column(db.String(500))
    assignee: int = db.Column(db.Integer, db.ForeignKey('user.user_id', onupdate='cascade'))
    requester: int = db.Column(db.Integer, db.ForeignKey('user.user_id', onupdate='cascade'), nullable=False)
    # Analysis.RequestedDate
    requested: datetime = db.Column(db.DateTime, nullable=False)
    started: datetime = db.Column(db.DateTime)
    finished: datetime = db.Column(db.DateTime)
    notes: str = db.Column(db.Text)
    # AnalysisStatus.UpdateDate
    updated: datetime = db.Column(db.DateTime, nullable=False, onupdate=datetime.now)
    # AnalysisStatus.UpdateUser
    updated_by: int = db.Column(db.Integer, db.ForeignKey('user.user_id', onupdate='cascade'), nullable=False)


@dataclass
class Pipeline(db.Model):
    pipeline_id: int = db.Column(db.Integer, primary_key=True)
    pipeline_name: str = db.Column(db.String(50), nullable=False)
    pipeline_version: str = db.Column(db.String(50), nullable=False)
    supported = db.relationship('PipelineDatasets', backref='pipeline')

    supported_types: List[DatasetType]
    @property
    def supported_types(self) -> List[DatasetType]:
        return [x.supported_dataset for x in self.supported]

    __table_args__ = (
        db.UniqueConstraint('pipeline_name', 'pipeline_version'),
    )


class PipelineDatasets(db.Model):
    pipeline_id: int = db.Column(db.Integer,
                                 db.ForeignKey('pipeline.pipeline_id', onupdate='cascade', ondelete='restrict'),
                                 primary_key=True)
    supported_dataset: DatasetType = db.Column(db.Enum(DatasetType), primary_key=True)
