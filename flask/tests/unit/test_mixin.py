"""
test mixin works on polymorphic models, eg. rnaseq_dataset 

For future reference - in tests that create an instance of a model where the intent is to replicate an object returned by a query, enums must also be appropriately specified.
For example in this test, if the 'DatasetCondition' and 'DatasetReadType' columns are not specified and passed as either a string or an enum when an RNASeqDataset instance is created, then the master `mixin` function, which is expected to throw an error, will actually pass, suggesting that there is no bug! 

"""

from app.models import RNASeqDataset
from app.utils import mixin
from sqlalchemy.types import Enum
from app.models import DatasetCondition, DatasetReadType


def test_mixin():
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

    enum_error = mixin(rnaseq_dataset_instance, rnaseq_changes, editable_columns)

    assert enum_error is None
    # this should fail on master
    assert rnaseq_dataset_instance.condition == rnaseq_changes["condition"]
