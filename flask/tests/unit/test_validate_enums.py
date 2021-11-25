"""
test validate_enums_and_set_fields works on polymorphic models, eg. rnaseq_dataset 

For future reference - in tests that create an instance of a model where the intent is to replicate an object returned by a query, enums must also be appropriately specified.
For example in this test, if the 'DatasetCondition' and 'DatasetReadType' columns are not specified and passed as either a string or an enum when an RNASeqDataset instance is created, then the master `mixin` function, which is expected to throw an error, will actually pass, suggesting that there is no bug! 

"""

from app.models import RNASeqDataset, DatasetCondition, DatasetReadType
from app.utils import validate_enums_and_set_fields
from sqlalchemy.types import Enum


def test_check_set_fields():
    rnaseq_dataset_instance = RNASeqDataset(
        dataset_id=1,
        candidate_genes="APOE",
        vcf_available=True,
        condition=DatasetCondition("Somatic"),
        dataset_type=Enum("rnaseq_dataset"),
        read_type=DatasetReadType("PairedEnd"),
    )

    rnaseq_changes = {
        "condition": "GermLine",
        "read_type": "SingleEnd",
    }

    editable_columns = ["condition", "read_type"]

    validate_enums_and_set_fields(
        rnaseq_dataset_instance, rnaseq_changes, editable_columns
    )
    # this should fail on master
    assert rnaseq_dataset_instance.condition == rnaseq_changes["condition"]
