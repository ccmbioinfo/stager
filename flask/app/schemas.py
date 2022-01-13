from marshmallow_sqlalchemy import SQLAlchemyAutoSchema
from marshmallow import fields, ValidationError
from marshmallow.validate import And, Length, Range, Regexp
from .models import *


class FamilySchema(SQLAlchemyAutoSchema):
    """
    POST /api/families
    """

    class Meta:
        model = Family
        include_fk = True
        load_instance = False
        exclude = ("created_by_id", "updated_by_id")
        unknown = "EXCLUDE"


class ParticipantSchema(SQLAlchemyAutoSchema):
    """
    POST /api/participants
    """

    class Meta:
        model = Participant
        include_fk = True
        load_instance = False
        exclude = ("created_by_id", "updated_by_id")
        unknown = "EXCLUDE"


class TissueSampleSchema(SQLAlchemyAutoSchema):
    """
    POST /api/tissue_samples
    """

    class Meta:
        model = TissueSample
        include_fk = True
        load_instance = False
        exclude = ("created_by_id", "updated_by_id")
        unknown = "EXCLUDE"


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
        exclude = ("created_by_id", "updated_by_id", "discriminator")
        unknown = "EXCLUDE"

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
        unknown = "EXCLUDE"

    datasets = fields.List(fields.Integer(), required=True, validate=Length(min=1))


class InstitutionSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = Institution
        include_fk = True
        load_instance = False
        unknown = "EXCLUDE"


class GroupSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = Group
        include_fk = True
        load_instance = False
        unknown = "EXCLUDE"

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
        ),
    )


class UserSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = User
        include_fk = True
        load_instance = False
        exclude = ["password_hash"]
        unknown = "EXCLUDE"

    def verify_email(email: str):
        space = email.find(" ")
        at = email.find("@")
        dot = email.find(".", at)
        if not (space == -1 and at > 0 and dot > at + 1):
            raise ValidationError("Invalid email")

    email = fields.String(required=True, validate=And(verify_email, Length(max=150)))
