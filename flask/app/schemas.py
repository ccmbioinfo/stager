from marshmallow_sqlalchemy import SQLAlchemyAutoSchema
from marshmallow import fields
from marshmallow.validate import Range, Length
from .models import *


class DatasetSchema(SQLAlchemyAutoSchema):
    """
    POST /api/datasets
    - a valid tissue_sample_id is required for the dataset to be linked
    - linked_files must be a valid list
    - created_by_id and updated_by_id is not given as part of the request body and should therefore be excluded from validation
    """

    class Meta:
        model = Dataset
        # needs to be True so fks eg. dataset_type are properly validated
        include_fk = True
        load_instance = False
        exclude = ("created_by_id", "updated_by_id")

    # may have to customize this line if it needs to be used outside of POST /api/datasets
    tissue_sample_id = fields.Integer(
        strict=True, required=True, validate=[Range(min=1)]
    )
    linked_files = fields.List(fields.String(), required=False)


class AnalysisSchema(SQLAlchemyAutoSchema):
    """
    POST /api/analyses
    - datasets is a list of integers to be linked with this given analysis
    """

    class Meta:
        model = Analysis
        include_fk = True
        load_instance = False
        exclude = (
            "assignee_id",
            "requester_id",
            "updated",
            "analysis_state",
            "requested",
            "updated_by_id",
        )

    datasets = fields.List(fields.Integer(), required=True, validate=Length(min=1))
