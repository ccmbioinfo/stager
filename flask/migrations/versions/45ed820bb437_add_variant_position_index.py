"""Add variant position index

Revision ID: 45ed820bb437
Revises: 6f448fc94a2d
Create Date: 2021-07-28 15:54:09.038932

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

# revision identifiers, used by Alembic.
revision = "45ed820bb437"
down_revision = "6f448fc94a2d"
branch_labels = None
depends_on = None


def upgrade():
    op.create_index(op.f("ix_variant_position"), "variant", ["position"], unique=False)


def downgrade():
    op.drop_index(op.f("ix_variant_position"), table_name="variant")
