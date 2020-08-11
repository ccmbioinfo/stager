"""Change participant types to Mother/Father instead of Parent

Revision ID: 0192fc410df8
Revises: 77b47135070f
Create Date: 2020-08-11 14:16:42.450103

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '0192fc410df8'
down_revision = '77b47135070f'
branch_labels = None
depends_on = None


def upgrade():
    op.execute("ALTER TABLE participant MODIFY COLUMN participant_type enum('Proband','Mother','Father','Sibling','Other');")


def downgrade():
    pass
