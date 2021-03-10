"""model gene pull schema

Revision ID: 50846a939bdd
Revises: ded8d42ffcb7
Create Date: 2021-03-10 18:32:42.836932

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "50846a939bdd"
down_revision = "ded8d42ffcb7"
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table(
        "gene",
        sa.Column("gene_id", sa.Integer(), nullable=False),
        sa.Column("hgnc_gene_id", sa.Integer(), nullable=True),
        sa.Column("ensembl_id", sa.Integer(), nullable=True),
        sa.Column("hgnc_gene_name", sa.String(length=50), nullable=True),
        sa.PrimaryKeyConstraint("gene_id"),
    )
    op.create_table(
        "variant",
        sa.Column("variant_id", sa.Integer(), nullable=False),
        sa.Column("position", sa.String(length=20), nullable=False),
        sa.Column("reference_allele", sa.String(length=50), nullable=False),
        sa.Column("alt_allele", sa.String(length=50), nullable=False),
        sa.Column(
            "variation",
            sa.Enum(
                "Missense_Variant",
                "Splice_Region_Variant",
                "Intergenic_Variant",
                "Intron_Variant",
                "Frameshift_Variant",
                "Upstream_Gene_Variant",
                "Inframe_Deletion",
                "Stop_Gained",
                "Inframe_Insertion",
                "Downstream_Gene_Variant",
                "Synonymous_Variant",
                "Non_Coding_Transcript_Exon_Variant",
                "Splice_Acceptor_Variant",
                "Splice_Donor_Variant",
                "Three_prime_UTR_Variant",
                "Five_prime_UTR_Variant",
                "Regultory_Region_Variant",
                "Stop_Lost",
                "Start_lost",
                "Protein_Altering_Variant",
                "Start_Retrained_Variant",
                "Mature_miRNA_Variant",
                "Stop_Retained_Variant",
                name="variation",
            ),
            nullable=False,
        ),
        sa.Column("refseq_change", sa.String(length=150), nullable=False),
        sa.Column("depth", sa.Integer(), nullable=False),
        sa.Column("gene_id", sa.Integer(), nullable=True),
        sa.Column("conserved_in_20_mammals", sa.Float(), nullable=True),
        sa.Column("sift_score", sa.Float(), nullable=True),
        sa.Column("polyphen_score", sa.Float(), nullable=True),
        sa.Column("cadd_score", sa.Float(), nullable=True),
        sa.Column("gnomad_af", sa.Float(), nullable=True),
        sa.ForeignKeyConstraint(
            ["gene_id"], ["gene.gene_id"], onupdate="cascade", ondelete="restrict"
        ),
        sa.PrimaryKeyConstraint("variant_id"),
    )
    op.create_table(
        "variants__analyses__association",
        sa.Column("variant_id", sa.Integer(), nullable=False),
        sa.Column("analysis_id", sa.Integer(), nullable=False),
        sa.Column("zygosity", sa.String(length=50), nullable=True),
        sa.Column("burden", sa.Integer(), nullable=True),
        sa.Column("alt_depths", sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(
            ["analysis_id"],
            ["analysis.analysis_id"],
        ),
        sa.ForeignKeyConstraint(
            ["variant_id"],
            ["variant.variant_id"],
        ),
        sa.PrimaryKeyConstraint("variant_id", "analysis_id"),
    )
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_table("variants__analyses__association")
    op.drop_table("variant")
    op.drop_table("gene")
    # ### end Alembic commands ###
