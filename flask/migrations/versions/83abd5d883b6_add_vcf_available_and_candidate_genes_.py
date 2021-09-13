"""add_vcf_available_and_candidate_genes_to_rna_seq_table

Revision ID: 83abd5d883b6
Revises: b7e6ad115b13
Create Date: 2021-09-13 20:19:38.571891

"""
from alembic import op
import sqlalchemy as sa

from app.models import Pipeline
from app.extensions import db


# revision identifiers, used by Alembic.
revision = "83abd5d883b6"
down_revision = "b7e6ad115b13"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "rnaseq_dataset", sa.Column("candidate_genes", sa.String(255), nullable=True)
    )
    op.add_column(
        "rnaseq_dataset", sa.Column("vcf_available", sa.Boolean(), nullable=True)
    )

    dig2 = Pipeline.query.filter_by(pipeline_name="dig2").first()
    if dig2:
        dig2.pipeline_name = "RNAseq"
        db.session.commit()


def downgrade():
    op.drop_column("rnaseq_dataset", "vcf_available")
    op.drop_column("rnaseq_dataset", "candidate_genes")
