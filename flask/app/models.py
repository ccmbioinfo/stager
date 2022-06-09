from dataclasses import dataclass
from datetime import date, datetime
from enum import Enum
from requests import get

from flask_login import UserMixin
from flask import current_app as app, Request
from sqlalchemy import CheckConstraint
from werkzeug.security import check_password_hash, generate_password_hash
from werkzeug.exceptions import Unauthorized

from .extensions import db

users_groups_table = db.Table(
    "users_groups",
    db.Model.metadata,
    db.Column("user_id", db.Integer, db.ForeignKey("user.user_id")),
    db.Column("group_id", db.Integer, db.ForeignKey("group.group_id")),
)


class User(UserMixin, db.Model):
    user_id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(30), nullable=False, unique=True)
    password_hash = db.Column(db.String(200), nullable=False, unique=False)
    email = db.Column(db.String(150), nullable=False, unique=True)
    is_admin = db.Column(db.Boolean, unique=False, default=False)
    last_login = db.Column(db.DateTime)
    deactivated = db.Column(db.Boolean, unique=False, nullable=False, default=False)
    minio_access_key = db.Column(db.String(150))
    minio_secret_key = db.Column(db.String(150))
    # OIDC columns; if either is null then we consider them non-oidc users
    issuer = db.Column(db.String(150))
    subject = db.Column(db.String(255))

    groups = db.relationship("Group", secondary=users_groups_table, backref="users")

    def set_password(self, password):
        self.password_hash = generate_password_hash(
            password, method="pbkdf2:sha256:50000"
        )

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def get_id(self):
        return self.user_id

    def set_oidc_fields(self, issuer: str, subject: str):
        self.issuer = issuer
        self.subject = subject

@dataclass
class Group(db.Model):
    group_id: int = db.Column(db.Integer, primary_key=True)
    group_code: str = db.Column(
        db.String(50),
        CheckConstraint(
            "LENGTH(group_code) > 2 AND group_code REGEXP '^[a-z,0-9,-]*$' AND BINARY group_code = LOWER(group_code)"
        ),
        nullable=False,
        unique=True,
    )
    group_name: str = db.Column(
        db.String(250), nullable=False, unique=True
    )  # full group name


@dataclass
class Family(db.Model):
    family_id: int = db.Column(db.Integer, primary_key=True)
    family_codename: str = db.Column(db.String(50), nullable=False, unique=True)
    family_aliases: str = db.Column(db.String(100))
    created: str = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    created_by_id = db.Column(
        db.Integer, db.ForeignKey("user.user_id", onupdate="cascade"), nullable=False
    )
    updated: str = db.Column(
        db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow
    )
    updated_by_id = db.Column(
        db.Integer, db.ForeignKey("user.user_id", onupdate="cascade"), nullable=False
    )
    participants = db.relationship("Participant", backref="family")

    updated_by = db.relationship("User", foreign_keys=[updated_by_id], lazy="joined")
    created_by = db.relationship("User", foreign_keys=[created_by_id], lazy="joined")


class Sex(str, Enum):
    Male = "Male"
    Female = "Female"
    Unknown = "Unknown"
    Other = "Other"


class ParticipantType(str, Enum):
    Proband = "Proband"
    Parent = "Parent"
    Sibling = "Sibling"
    Other = "Other"


@dataclass
class Participant(db.Model):
    participant_id: int = db.Column(db.Integer, primary_key=True)
    family_id = db.Column(db.Integer, db.ForeignKey("family.family_id"), nullable=False)
    participant_codename: str = db.Column(db.String(50), nullable=False, unique=True)
    participant_aliases: str = db.Column(db.String(100))
    sex: Sex = db.Column(db.Enum(Sex))
    participant_type: ParticipantType = db.Column(db.Enum(ParticipantType))
    month_of_birth: date = db.Column(
        db.Date, CheckConstraint("DAY(month_of_birth) = 1")
    )
    institution_id = db.Column(
        db.Integer, db.ForeignKey("institution.institution_id", onupdate="cascade")
    )
    affected: bool = db.Column(db.Boolean)
    solved: bool = db.Column(db.Boolean)  # TODO uncomment and rebuild
    notes: str = db.Column(db.Text)
    created: datetime = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    created_by_id = db.Column(
        db.Integer, db.ForeignKey("user.user_id", onupdate="cascade"), nullable=False
    )
    updated: datetime = db.Column(
        db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow
    )
    updated_by_id = db.Column(
        db.Integer, db.ForeignKey("user.user_id", onupdate="cascade"), nullable=False
    )
    tissue_samples = db.relationship("TissueSample", backref="participant")
    institution = db.relationship("Institution", foreign_keys=[institution_id])
    updated_by = db.relationship("User", foreign_keys=[updated_by_id])
    created_by = db.relationship("User", foreign_keys=[created_by_id])


@dataclass
class Institution(db.Model):
    institution_id: int = db.Column(db.Integer, primary_key=True)
    institution: str = db.Column(db.String(100), unique=True, nullable=False)


class TissueSampleType(str, Enum):
    Blood = "Blood"  # BLO
    Saliva = "Saliva"  # SAL
    Lymphocyte = "Lymphocyte"  # LYM
    Fibroblast = "Fibroblast"  # FIB
    Muscle = "Muscle"  # MUS
    Skin = "Skin"  # SKI
    Urine = "Urine"  # URI
    Plasma = "Plasma"  # PLA
    Unknown = "Unknown"  # UNK
    Kidney = "Kidney"  # KID


class TissueProcessing(str, Enum):
    FreshFrozen = "FF"
    Formaldehyde = "FFPE"


@dataclass
class TissueSample(db.Model):
    tissue_sample_id: int = db.Column(db.Integer, primary_key=True)
    participant_id: int = db.Column(
        db.Integer, db.ForeignKey("participant.participant_id"), nullable=False
    )
    extraction_date: datetime = db.Column(db.Date)
    tissue_sample_type: TissueSampleType = db.Column(
        db.Enum(TissueSampleType), nullable=False
    )
    tissue_processing: TissueProcessing = db.Column(db.Enum(TissueProcessing))
    notes: str = db.Column(db.Text)
    created: datetime = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    created_by_id = db.Column(
        db.Integer, db.ForeignKey("user.user_id", onupdate="cascade"), nullable=False
    )
    updated: datetime = db.Column(
        db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.now
    )
    updated_by_id = db.Column(
        db.Integer, db.ForeignKey("user.user_id", onupdate="cascade"), nullable=False
    )
    datasets = db.relationship("Dataset", backref="tissue_sample")
    updated_by = db.relationship("User", foreign_keys=[updated_by_id])
    created_by = db.relationship("User", foreign_keys=[created_by_id])


class DatasetCondition(str, Enum):
    Control = "Control"
    GermLine = "GermLine"  # e.g. rare diseases
    Somatic = "Somatic"  # e.g. cancer


class DatasetReadType(str, Enum):
    PairedEnd = "PairedEnd"
    SingleEnd = "SingleEnd"


groups_datasets_table = db.Table(
    "groups_datasets",
    db.Model.metadata,
    db.Column("group_id", db.Integer, db.ForeignKey("group.group_id")),
    db.Column("dataset_id", db.Integer, db.ForeignKey("dataset.dataset_id")),
)


datasets_analyses_table = db.Table(
    "datasets_analyses",
    db.Model.metadata,
    db.Column(
        "dataset_id",
        db.Integer,
        db.ForeignKey("dataset.dataset_id"),
    ),
    db.Column("analysis_id", db.Integer, db.ForeignKey("analysis.analysis_id")),
    db.PrimaryKeyConstraint(
        "dataset_id", "analysis_id"
    ),  # for our composite FK on genotype
)

datasets_files_table = db.Table(
    "datasets_files",
    db.Model.metadata,
    db.Column("file_id", db.Integer, db.ForeignKey("file.file_id"), nullable=False),
    db.Column(
        "dataset_id",
        db.Integer,
        db.ForeignKey("dataset.dataset_id", ondelete="cascade"),
        nullable=False,
    ),
)

DATASET_TYPES = {
    "RES": {"name": "Research Exome Sequencing", "kind": "exomic"},
    "CES": {"name": "Clinical Exome Sequencing", "kind": "exomic"},
    "WES": {"name": "Whole Exome Sequencing", "kind": "exomic"},
    "CPS": {"name": "Clinical Panel Sequencing", "kind": "exomic"},
    "RCS": {"name": "Research Clinome Sequencing", "kind": "exomic"},
    "RDC": {"name": "Research Deep Clinome Sequencing", "kind": "exomic"},
    "RDE": {"name": "Research Deep Exome Sequencing", "kind": "exomic"},
    "RDP": {"name": "Research Deep Panel Sequencing", "kind": "deep panel"},
    "RGS": {"name": "Research Genome Sequencing", "kind": "short-read genomic"},
    "CGS": {"name": "Clinical Genome Sequencing", "kind": "short-read genomic"},
    "WGS": {"name": "Whole Genome Sequencing", "kind": "short-read genomic"},
    "LGS": {
        "name": "Research Long-read Genome Sequencing",
        "kind": "long-read genomic",
    },
    "RRS": {"name": "Research RNA Sequencing", "kind": "short-read transcriptomic"},
    "LRS": {
        "name": "Research Long-read RNA Sequencing",
        "kind": "long-read transcriptomic",
    },
    "RLM": {"name": "Research Lipidomics Mass Spectrometry", "kind": "other"},
    "RMM": {"name": "Research Metabolomics Mass Spectrometry", "kind": "other"},
    "RTA": {"name": "Research DNA Methylation Array", "kind": "other"},
}


@dataclass
class Dataset(db.Model):
    __tablename__ = "dataset"
    tissue_sample_id: int = db.Column(
        db.Integer, db.ForeignKey("tissue_sample.tissue_sample_id"), nullable=False
    )
    dataset_id: int = db.Column(db.Integer, primary_key=True)
    dataset_type: str = db.Column(db.String(50), nullable=False)
    notes: str = db.Column(db.Text)
    condition: DatasetCondition = db.Column(db.Enum(DatasetCondition), nullable=False)
    extraction_protocol: str = db.Column(db.String(100))
    capture_kit: str = db.Column(db.String(50))
    library_prep_method: str = db.Column(db.String(50))
    library_prep_date: datetime = db.Column(db.Date)
    read_length: int = db.Column(db.Integer)
    read_type: DatasetReadType = db.Column(db.Enum(DatasetReadType))
    sequencing_id: str = db.Column(db.String(50))
    sequencing_date: datetime = db.Column(db.Date)
    sequencing_centre: str = db.Column(db.String(100))
    batch_id: str = db.Column(db.String(50))
    created: datetime = db.Column(db.DateTime, default=datetime.utcnow)
    created_by_id = db.Column(
        db.Integer, db.ForeignKey("user.user_id", onupdate="cascade"), nullable=False
    )
    updated: datetime = db.Column(
        db.DateTime, nullable=False, onupdate=datetime.now, default=datetime.utcnow
    )
    updated_by_id = db.Column(
        db.Integer, db.ForeignKey("user.user_id", onupdate="cascade"), nullable=False
    )

    discriminator: str = db.Column(db.Enum("dataset", "rnaseq_dataset"), nullable=False)
    __mapper_args__ = {
        "polymorphic_identity": "dataset",
        "polymorphic_on": discriminator,
        "with_polymorphic": "*",
    }

    analyses = db.relationship(
        "Analysis", secondary=datasets_analyses_table, backref="datasets"
    )
    groups = db.relationship(
        "Group", secondary=groups_datasets_table, backref="datasets"
    )
    updated_by = db.relationship("User", foreign_keys=[updated_by_id], lazy="joined")
    created_by = db.relationship("User", foreign_keys=[created_by_id], lazy="joined")
    linked_files = db.relationship(
        "File",
        secondary=datasets_files_table,
        backref="datasets",
        passive_deletes=True,
    )


@dataclass
class RNASeqDataset(Dataset):
    __tablename__ = "rnaseq_dataset"
    dataset_id: int = db.Column(
        db.Integer,
        db.ForeignKey("dataset.dataset_id", onupdate="cascade", ondelete="cascade"),
        primary_key=True,
    )
    candidate_genes: str = db.Column(db.String(255))
    RIN: float = db.Column(db.Float)
    DV200: int = db.Column(db.Integer)
    concentration: float = db.Column(db.Float)
    sequencer: str = db.Column(db.String(50))
    spike_in: str = db.Column(db.String(50))
    vcf_available: str = db.Column(db.Boolean)

    __mapper_args__ = {
        "polymorphic_identity": "rnaseq_dataset",
    }


@dataclass
class File(db.Model):
    file_id = db.Column(db.Integer, primary_key=True)
    path: str = db.Column(db.String(500), nullable=False, unique=True)
    multiplexed: bool = db.Column(db.Boolean)


class AnalysisState(str, Enum):
    Requested = "Requested"
    Running = "Running"
    Done = "Done"
    Error = "Error"
    Cancelled = "Cancelled"


class PriorityType(str, Enum):
    Clinical = "Clinical"
    Research = "Research"


@dataclass
class Analysis(db.Model):
    analysis_id: int = db.Column(db.Integer, primary_key=True)
    analysis_state: AnalysisState = db.Column(db.Enum(AnalysisState), nullable=False)
    kind: str = db.Column(db.String(50), nullable=False)
    scheduler_id: int = db.Column(db.Integer)
    result_path: str = db.Column(db.String(500))
    assignee_id = db.Column(
        db.Integer, db.ForeignKey("user.user_id", onupdate="cascade")
    )
    requester_id = db.Column(
        db.Integer, db.ForeignKey("user.user_id", onupdate="cascade"), nullable=False
    )
    requested: datetime = db.Column(db.DateTime, nullable=False)
    started: datetime = db.Column(db.DateTime)
    finished: datetime = db.Column(db.DateTime)
    notes: str = db.Column(db.Text)
    updated: datetime = db.Column(db.DateTime, nullable=False, onupdate=datetime.now)
    updated_by_id = db.Column(
        db.Integer, db.ForeignKey("user.user_id", onupdate="cascade"), nullable=False
    )
    updated_by = db.relationship("User", foreign_keys=[updated_by_id], lazy="joined")
    assignee = db.relationship("User", foreign_keys=[assignee_id], lazy="joined")
    requester = db.relationship("User", foreign_keys=[requester_id], lazy="joined")
    variants = db.relationship("Variant", backref="analysis")
    priority: PriorityType = db.Column(db.Enum(PriorityType))


@dataclass
class Gene(db.Model):
    # these are indeed unique in the gtf
    ensembl_id: int = db.Column(db.Integer, primary_key=True)
    # hgnc_id: int = db.Column(db.Integer, unique=True)
    # ncbi_id: int = db.Column(db.Integer, unique=True)
    chromosome: str = db.Column(db.String(2), nullable=False)
    # indicates whether the feature is from havana, ensembl or both
    source: str = db.Column(db.String(20))
    # GRCh37 coordinates, incompatible with others
    start: int = db.Column(db.Integer, nullable=False)
    end: int = db.Column(db.Integer, nullable=False)
    aliases = db.relationship("GeneAlias", backref="gene")


@dataclass
class GeneAlias(db.Model):
    # Autoincrement surrogate key
    alias_id = db.Column(db.Integer, primary_key=True)
    ensembl_id: int = db.Column(
        db.Integer,
        db.ForeignKey("gene.ensembl_id", onupdate="cascade", ondelete="cascade"),
    )
    # Not unique in case one name corresponds to multiple ENSGs across releases
    name: str = db.Column(db.String(50), nullable=False)
    # Optional flexible type label, e.g., current hgnc gene symbol, previous gene symbol, synonyms
    kind: str = db.Column(db.String(50))
    # No point in allowing dupes for the same identifier though
    __table_args__ = (
        db.UniqueConstraint("ensembl_id", "name"),
        db.Index("gene_alias_ensembl_id_IDX", "ensembl_id"),
    )


@dataclass
class Variant(db.Model):
    # table contains both variant-annotation (external, versioned annotation information) and variant-analysis (vcf) information.
    # in the future, the variant-analysis information could be stored in the database and
    # variant-annotations would be performed on the fly potentially through click commands or additional tables
    variant_id: int = db.Column(db.Integer, primary_key=True)
    analysis_id: int = db.Column(
        db.Integer, db.ForeignKey("analysis.analysis_id"), nullable=False
    )
    chromosome: str = db.Column(db.String(2), nullable=False)
    # GRCh37 coordinates, incompatible with others
    position: int = db.Column(db.Integer, nullable=False, index=True)
    reference_allele: str = db.Column(db.String(300), nullable=False)
    alt_allele: str = db.Column(db.String(300), nullable=False)
    variation: str = db.Column(db.String(50), nullable=False)
    refseq_change = db.Column(db.String(500), nullable=True)
    depth: int = db.Column(db.Integer, nullable=False)
    conserved_in_20_mammals: int = db.Column(db.Float, nullable=True)
    sift_score: int = db.Column(db.Float, nullable=True)
    polyphen_score: int = db.Column(db.Float, nullable=True)
    cadd_score: int = db.Column(db.Float, nullable=True)
    gnomad_af: int = db.Column(db.Float, nullable=True)

    ucsc_link: str = db.Column(db.String(300), nullable=True)
    gnomad_link: str = db.Column(db.String(500), nullable=True)
    # can be hgnc, ensembl or null depending on age of report. reports from 2020-08 onwards are guaranteed to have either hgnc or ensembl id in this, exists to facilitate comparison
    gene: str = db.Column(db.String(50), nullable=True)
    info: str = db.Column(db.Text(15000), nullable=True)
    quality: int = db.Column(db.Integer, nullable=True)
    clinvar: str = db.Column(db.String(200), nullable=True)
    gnomad_af_popmax: int = db.Column(db.Float, nullable=True)
    gnomad_ac: int = db.Column(db.Integer, nullable=True)
    gnomad_hom: int = db.Column(db.Integer, nullable=True)
    # unfortunately, not always an ensembl gene id
    report_ensembl_gene_id: str = db.Column(db.String(50), nullable=True)
    # unfortunately, not always an ensembl transcript id
    ensembl_transcript_id: str = db.Column(db.String(50), nullable=True)
    aa_position: str = db.Column(db.String(50), nullable=True)
    exon: str = db.Column(db.String(50), nullable=True)
    protein_domains: str = db.Column(db.String(750), nullable=True)
    rsids: str = db.Column(db.String(500), nullable=True)  # comma delimited
    gnomad_oe_lof_score: int = db.Column(db.Float, nullable=True)
    gnomad_oe_mis_score: int = db.Column(db.Float, nullable=True)
    exac_pli_score: int = db.Column(db.Float, nullable=True)
    exac_prec_score: int = db.Column(db.Float, nullable=True)
    exac_pnull_score: int = db.Column(db.Float, nullable=True)
    spliceai_impact: str = db.Column(db.String(1000), nullable=True)
    spliceai_score: str = db.Column(db.Float, nullable=True)
    vest3_score: int = db.Column(db.Float, nullable=True)
    revel_score: int = db.Column(db.Float, nullable=True)
    gerp_score: int = db.Column(db.Float, nullable=True)
    imprinting_status: str = db.Column(db.String(50), nullable=True)
    imprinting_expressed_allele: str = db.Column(db.String(50), nullable=True)
    pseudoautosomal: str = db.Column(db.Boolean, nullable=True)  # 'Nan'/Yes/Na
    number_of_callers: int = db.Column(db.Integer, nullable=True)
    old_multiallelic: str = db.Column(db.String(500), nullable=True)
    uce_100bp: bool = db.Column(db.Boolean, nullable=True)
    uce_200bp: bool = db.Column(db.Boolean, nullable=True)


@dataclass
class Genotype(db.Model):

    variant_id: int = db.Column(
        db.Integer,
        db.ForeignKey("variant.variant_id"),
        primary_key=True,
    )
    analysis_id: int = db.Column(
        db.Integer,
        db.ForeignKey("analysis.analysis_id"),
        primary_key=True,
    )
    dataset_id: int = db.Column(
        db.Integer,
        db.ForeignKey("dataset.dataset_id"),
        primary_key=True,
    )

    variant = db.relationship("Variant", backref="genotype", foreign_keys=[variant_id])

    analysis = db.relationship(
        "Analysis",
        backref="genotype",
        foreign_keys=[analysis_id],
    )
    dataset = db.relationship(
        "Dataset",
        backref="genotype",
        foreign_keys=[dataset_id],
    )

    zygosity: str = db.Column(db.String(50))
    burden: int = db.Column(db.Integer)
    alt_depths: int = db.Column(db.Integer)
    genotype: str = db.Column(db.String(2500), nullable=True)  # from gts
    coverage: int = db.Column(db.Integer, nullable=True)  # from trio_coverage

    __table_args__ = (
        db.ForeignKeyConstraint(
            [analysis_id, dataset_id],
            ["datasets_analyses.analysis_id", "datasets_analyses.dataset_id"],
        ),
        db.ForeignKeyConstraint(
            [analysis_id, variant_id],
            ["variant.analysis_id", "variant.variant_id"],
        ),
    )
