from marshmallow import fields, ValidationError
from marshmallow_sqlalchemy import SQLAlchemyAutoSchema
from marshmallow.validate import And, Length, OneOf, Range, Regexp
from .models import *


class FamilySchema(SQLAlchemyAutoSchema):
    """
    POST /api/families
    """

    class Meta:
        model = Family
        include_fk = True
        include_relationships = True
        load_instance = False
        exclude = ("created_by_id", "updated_by_id")


class ParticipantSchema(SQLAlchemyAutoSchema):
    """
    POST /api/participants
    """

    class Meta:
        model = Participant
        include_fk = True
        include_relationships = True
        load_instance = False
        exclude = ("created_by_id", "updated_by_id")


class TissueSampleSchema(SQLAlchemyAutoSchema):
    """
    POST /api/tissue_samples
    """

    class Meta:
        model = TissueSample
        include_fk = True
        include_relationships = True
        load_instance = False
        exclude = ("created_by_id", "updated_by_id")


class RNASeqDatasetSchema(SQLAlchemyAutoSchema):
    """
    POST /api/datasets
    - created_by_id and updated_by_id is not given as part of the request body and should therefore be excluded from validation
    - discriminator field is populated automatically when a new dataset is inserted into the database.
    - linked_files is excluded from validation because its validation needs to be handled differently in different endpoints.
    - valid tissue_sample_id is required for the dataset to be linked
    This schema is used to validate both Dataset model and RNASeqDataset model.
    Since RNASeqDataset model extends from Dataset model, a separate DatasetSchema is not used.
    """

    class Meta:
        model = RNASeqDataset
        # needs to be True so fks eg. dataset_type are properly validated
        include_fk = True
        include_relationships = True
        load_instance = False
        exclude = (
            "created_by_id",
            "updated_by_id",
            "discriminator",
            "linked_files",
            "dataset_id",
        )

    tissue_sample_id = fields.Integer(
        strict=True, required=True, validate=[Range(min=1)]
    )
    dataset_type = fields.Str(required=True, validate=OneOf(DATASET_TYPES.keys()))


class AnalysisSchema(SQLAlchemyAutoSchema):
    """
    POST /api/analyses
    - datasets is a list of integers to be linked with this given analysis
    """

    class Meta:
        model = Analysis
        include_fk = True
        include_relationships = True
        load_instance = False
        exclude = (
            "assignee_id",
            "requester_id",
            "updated",
            "analysis_state",
            "requested",
            "updated_by_id",
            "kind",
        )

    datasets = fields.List(fields.Integer(), required=True, validate=Length(min=1))


class GroupSchema(SQLAlchemyAutoSchema):
    """
    POST /api/groups
    """

    class Meta:
        model = Group
        include_fk = True
        include_relationships = True
        load_instance = False

    group_code = fields.String(
        required=True,
        validate=And(
            Regexp(regex="^[a-z,0-9,-]*$"),
            Regexp(
                regex="^(?!results-$).*$",
                error="A group codename cannot start with 'results-'",
                # madmin.py::stager_buckets_policy
            ),
            Length(min=3),
            Length(max=50),
        ),
    )

    group_name = fields.String(
        required=True, validate=And(Length(min=1), Length(max=250))
    )


class UserSchema(SQLAlchemyAutoSchema):
    """
    POST /api/users
    - password_hash is generated and should not be included in the user input.
    """

    class Meta:
        model = User
        include_fk = True
        include_relationships = True
        load_instance = False
        exclude = ["password_hash"]

    def verify_email(email: str):
        space = email.find(" ")
        at = email.find("@")
        dot = email.find(".", at)
        if not (space == -1 and at > 0 and dot > at + 1):
            raise ValidationError("Invalid email")

    username = fields.String(required=True, validate=And(Length(min=1), Length(max=30)))
    email = fields.String(
        required=True, validate=And(verify_email, Length(min=1), Length(max=150))
    )
