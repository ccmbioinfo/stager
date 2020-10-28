"""updating pipeline table to support MetaDatasetType

Revision ID: 36568d61ad8b
Revises: 472c86a67692
Create Date: 2020-10-28 13:27:19.218669

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

# revision identifiers, used by Alembic.
revision = '36568d61ad8b'
down_revision = '472c86a67692'
branch_labels = None
depends_on = None


def upgrade():
    # supported_dataset to use the MetaDatasetType ENUM
    op.execute("ALTER TABLE pipeline_datasets CHANGE COLUMN supported_dataset supported_dataset ENUM('Exome', 'Genome', 'RNA', 'Other') NOT NULL;")


def downgrade():
    # supported_dataset to use the DatasetType ENUM
    op.execute("ALTER TABLE pipeline_datasets CHANGE COLUMN supported_dataset supported_dataset ENUM('CES', 'CGS', 'CPS', 'RES', 'RGS', 'RLM', 'RMM', 'RRS', 'RTA', 'WES', 'WGS', 'RCS', 'RDC', 'RDE') NOT NULL;")
