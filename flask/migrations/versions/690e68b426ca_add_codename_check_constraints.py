"""Add codename check constraints

Revision ID: 690e68b426ca
Revises: c137bdb34421
Create Date: 2022-06-20 12:02:15.842344

"""
from alembic import op


# revision identifiers, used by Alembic.
revision = "690e68b426ca"
down_revision = "c137bdb34421"
branch_labels = None
depends_on = None


def upgrade():
    op.execute(
        "ALTER TABLE family ADD CONSTRAINT family_chk_codename CHECK (family_codename REGEXP '^[[:alnum:],-,_]+$')"
    )
    op.execute(
        "ALTER TABLE participant ADD CONSTRAINT participant_chk_codename CHECK (participant_codename REGEXP '^[.,[:alnum:],-,_]+$' AND participant_codename NOT REGEXP '^[.]+$')"
    )


def downgrade():
    op.execute("ALTER TABLE family DROP CHECK family_chk_codename")
    op.execute("ALTER TABLE participant DROP CHECK participant_chk_codename")
