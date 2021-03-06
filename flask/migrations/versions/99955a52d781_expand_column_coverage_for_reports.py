"""Expand column coverage for reports

Revision ID: 99955a52d781
Revises: 5e69ca582792
Create Date: 2021-06-30 14:21:17.119126

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "99955a52d781"
down_revision = "5e69ca582792"
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column("genotype", sa.Column("coverage", sa.Integer(), nullable=True))
    op.add_column(
        "genotype", sa.Column("genotype", sa.String(length=2500), nullable=True)
    )
    op.add_column(
        "variant", sa.Column("aa_position", sa.String(length=50), nullable=True)
    )
    op.add_column("variant", sa.Column("clinvar", sa.String(length=200), nullable=True))
    op.add_column(
        "variant",
        sa.Column("ensembl_transcript_id", sa.String(length=50), nullable=True),
    )
    op.add_column("variant", sa.Column("exac_pli_score", sa.Float(), nullable=True))
    op.add_column("variant", sa.Column("exac_pnull_score", sa.Float(), nullable=True))
    op.add_column("variant", sa.Column("exac_prec_score", sa.Float(), nullable=True))
    op.add_column("variant", sa.Column("exon", sa.String(length=50), nullable=True))
    op.add_column("variant", sa.Column("gene", sa.String(length=50), nullable=True))
    op.add_column("variant", sa.Column("gerp_score", sa.Float(), nullable=True))
    op.add_column("variant", sa.Column("gnomad_ac", sa.Integer(), nullable=True))
    op.add_column("variant", sa.Column("gnomad_af_popmax", sa.Float(), nullable=True))
    op.add_column("variant", sa.Column("gnomad_hom", sa.Integer(), nullable=True))
    op.add_column(
        "variant", sa.Column("gnomad_link", sa.String(length=500), nullable=True)
    )
    op.add_column(
        "variant", sa.Column("gnomad_oe_lof_score", sa.Float(), nullable=True)
    )
    op.add_column(
        "variant", sa.Column("gnomad_oe_mis_score", sa.Float(), nullable=True)
    )
    op.add_column(
        "variant",
        sa.Column("imprinting_expressed_allele", sa.String(length=50), nullable=True),
    )
    op.add_column(
        "variant", sa.Column("imprinting_status", sa.String(length=50), nullable=True)
    )
    op.add_column("variant", sa.Column("info", sa.Text(length=15000), nullable=True))
    op.add_column(
        "variant", sa.Column("number_of_callers", sa.Integer(), nullable=True)
    )
    op.add_column(
        "variant", sa.Column("old_multiallelic", sa.String(length=500), nullable=True)
    )
    op.add_column(
        "variant", sa.Column("protein_domains", sa.String(length=750), nullable=True)
    )
    op.add_column("variant", sa.Column("pseudoautosomal", sa.Boolean(), nullable=True))
    op.add_column("variant", sa.Column("quality", sa.Integer(), nullable=True))
    op.add_column(
        "variant",
        sa.Column("report_ensembl_gene_id", sa.String(length=50), nullable=True),
    )
    op.add_column("variant", sa.Column("revel_score", sa.Float(), nullable=True))
    op.add_column("variant", sa.Column("rsids", sa.String(length=500), nullable=True))
    op.add_column(
        "variant", sa.Column("spliceai_impact", sa.String(length=1000), nullable=True)
    )
    op.add_column("variant", sa.Column("spliceai_score", sa.Float(), nullable=True))
    op.add_column("variant", sa.Column("uce_100bp", sa.Boolean(), nullable=True))
    op.add_column("variant", sa.Column("uce_200bp", sa.Boolean(), nullable=True))
    op.add_column(
        "variant", sa.Column("ucsc_link", sa.String(length=300), nullable=True)
    )
    op.add_column("variant", sa.Column("vest3_score", sa.Float(), nullable=True))
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_column("variant", "vest3_score")
    op.drop_column("variant", "ucsc_link")
    op.drop_column("variant", "uce_200bp")
    op.drop_column("variant", "uce_100bp")
    op.drop_column("variant", "spliceai_score")
    op.drop_column("variant", "spliceai_impact")
    op.drop_column("variant", "rsids")
    op.drop_column("variant", "revel_score")
    op.drop_column("variant", "report_ensembl_gene_id")
    op.drop_column("variant", "quality")
    op.drop_column("variant", "pseudoautosomal")
    op.drop_column("variant", "protein_domains")
    op.drop_column("variant", "old_multiallelic")
    op.drop_column("variant", "number_of_callers")
    op.drop_column("variant", "info")
    op.drop_column("variant", "imprinting_status")
    op.drop_column("variant", "imprinting_expressed_allele")
    op.drop_column("variant", "gnomad_oe_mis_score")
    op.drop_column("variant", "gnomad_oe_lof_score")
    op.drop_column("variant", "gnomad_link")
    op.drop_column("variant", "gnomad_hom")
    op.drop_column("variant", "gnomad_af_popmax")
    op.drop_column("variant", "gnomad_ac")
    op.drop_column("variant", "gerp_score")
    op.drop_column("variant", "gene")
    op.drop_column("variant", "exon")
    op.drop_column("variant", "exac_prec_score")
    op.drop_column("variant", "exac_pnull_score")
    op.drop_column("variant", "exac_pli_score")
    op.drop_column("variant", "ensembl_transcript_id")
    op.drop_column("variant", "clinvar")
    op.drop_column("variant", "aa_position")
    op.drop_column("genotype", "genotype")
    op.drop_column("genotype", "coverage")
    # ### end Alembic commands ###
