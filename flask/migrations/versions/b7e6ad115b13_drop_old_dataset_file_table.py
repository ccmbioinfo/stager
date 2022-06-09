"""drop_old_dataset_file_table

Revision ID: b7e6ad115b13
Revises: 45ed820bb437
Create Date: 2021-07-29 16:43:21.898351

"""
from alembic import op
import sqlalchemy as sa

# NOTE: DO NOT DO THIS, STATIC MIGRATIONS CANNOT DEPEND ON A CHANGING MODEL FILE
from app.models import File
from app import db

# revision identifiers, used by Alembic.
revision = "b7e6ad115b13"
down_revision = "45ed820bb437"
branch_labels = None
depends_on = None


def upgrade():
    op.drop_table("dataset_file")


def downgrade():

    dataset_file_table = op.create_table(
        "dataset_file",
        sa.Column("file_id", sa.Integer(), nullable=False),
        sa.Column("dataset_id", sa.Integer(), nullable=False),
        sa.Column("path", sa.String(length=500), nullable=False),
        sa.ForeignKeyConstraint(
            ["dataset_id"],
            ["dataset.dataset_id"],
            onupdate="cascade",
            ondelete="cascade",
        ),
        sa.PrimaryKeyConstraint("file_id"),
    )

    for file in File.query.all():
        for dataset in file.datasets:
            stmt = dataset_file_table.insert().values(
                path=file.path, dataset_id=dataset.dataset_id
            )
            db.session.execute(stmt)
    db.session.commit()
