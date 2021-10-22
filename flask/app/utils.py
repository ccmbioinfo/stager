from csv import DictWriter, QUOTE_MINIMAL
from dataclasses import asdict, dataclass
from datetime import date, datetime, time
from enum import Enum
from functools import wraps
from io import BytesIO, StringIO
from os import getenv
from typing import Any, Callable, Dict, List, Union, Iterable, Mapping
from flask import (
    abort,
    current_app as app,
    jsonify,
    request,
    Request,
    send_file,
)
from flask.globals import current_app
from flask.json import JSONEncoder
from flask_login import current_user
from flask_sqlalchemy import Model
from flask_sqlalchemy.model import DefaultMeta
from sqlalchemy import exc
from sqlalchemy import inspect
from sqlalchemy.orm.query import Query
from sqlalchemy.sql.sqltypes import Enum as SqlAlchemyEnum
from werkzeug.exceptions import HTTPException

from .extensions import db
from .madmin import MinioAdmin
from .models import User, Group, Dataset, Variant, Genotype


def try_int(value: str):
    if value is not None:
        try:
            int_value = int(value)
        except ValueError as e:
            int_value = None
        return int_value
    else:
        return value


def create_variant_obj(row: Dict[str, any], analysis_id: int) -> Variant:
    vt_obj = Variant(
        analysis_id=analysis_id,
        chromosome=row.get("chromosome"),
        position=row.get("position"),
        reference_allele=row.get("reference_allele"),
        alt_allele=row.get("alt_allele"),
        variation=row.get("variation"),
        refseq_change=row.get("refseq_change"),
        depth=row.get("depth"),
        conserved_in_20_mammals=row.get("conserved_in_20_mammals"),
        sift_score=row.get("sift_score"),
        polyphen_score=row.get("polyphen_score"),
        cadd_score=row.get("cadd_score"),
        gnomad_af=row.get("gnomad_af"),
        ucsc_link=row.get("ucsc_link"),
        gnomad_link=row.get("gnomad_link"),
        gene=row.get("gene"),
        info=row.get("info"),
        quality=row.get("quality"),
        clinvar=row.get("clinvar"),
        gnomad_af_popmax=row.get("gnomad_af_popmax"),
        gnomad_ac=row.get("gnomad_ac"),
        gnomad_hom=row.get("gnomad_hom"),
        report_ensembl_gene_id=row.get("ensembl_gene_id"),
        ensembl_transcript_id=row.get("ensembl_transcript_id"),
        aa_position=row.get("aa_position"),
        exon=row.get("exon"),
        protein_domains=row.get("protein_domains"),
        rsids=row.get("rsids"),
        gnomad_oe_lof_score=row.get("gnomad_oe_lof_score"),
        gnomad_oe_mis_score=row.get("gnomad_oe_mis_score"),
        exac_pli_score=row.get("gnomad_oe_mis_score"),
        exac_prec_score=row.get("exac_prec_score"),
        exac_pnull_score=row.get("exac_pnull_score"),
        spliceai_impact=row.get("spliceai_impact"),
        spliceai_score=row.get("spliceai_score"),
        vest3_score=row.get("vest3_score"),
        revel_score=row.get("revel_score"),
        gerp_score=row.get("gerp_score"),
        imprinting_status=row.get("imprinting_status"),
        imprinting_expressed_allele=row.get("imprinting_expressed_allele"),
        pseudoautosomal=row.get("pseudoautosomal"),
        number_of_callers=try_int(row.get("number_of_callers")),
        old_multiallelic=row.get("old_multiallelic"),
        uce_100bp=row.get("uce_100bp"),
        uce_200bp=row.get("uce_200bp"),
    )

    return vt_obj


def create_genotype_obj(
    row: Dict[str, any], analysis_id: int, dataset_id: int, variant_id: int
) -> Genotype:
    gt_obj = Genotype(
        variant_id=variant_id,
        analysis_id=analysis_id,
        dataset_id=dataset_id,
        zygosity=row.get("zygosity"),
        burden=try_int(row.get("burden")),
        alt_depths=try_int(row.get("alt_depths")),
        coverage=try_int(row.get("coverage")),
        genotype=row.get("genotype"),
    )

    return gt_obj


def str_to_bool(param: str) -> bool:
    return param.lower() == "true"


def handle_error(e):
    code = 500
    if isinstance(e, HTTPException):
        code = e.code
    return jsonify(error=str(e.description)), code


def get_mapper(entity: db.Model):
    _mapper = inspect(entity)
    return _mapper if isinstance(entity, DefaultMeta) else _mapper.mapper


def validate_enums_and_set_fields(
    entity: db.Model,
    json_mixin: Dict[str, Any],
    allowed_columns: List[str],
) -> Union[None, str]:
    """
    Used primarily in PATCH requests to modify a loaded model instance in-place. Checks for valid enums and adds them to the model if they exist
    """
    for field in allowed_columns:
        if field in json_mixin:
            validate_enum(entity, field, json_mixin[field])
            setattr(entity, field, json_mixin[field])


def validate_enums(
    entity: db.Model,
    json_mixin: Dict[str, Any],
    allowed_columns: List[str],
) -> Union[None, str]:
    """
    Used primarily in POST requests, where entity is a class blueprint. Adds the allowed fields to the model if they exist
    """
    for field in allowed_columns:
        if field in json_mixin:
            validate_enum(entity, field, json_mixin[field])


def validate_enum(
    entity: db.Model,
    field_name: str,
    value: str,
):
    """
    Check whether the specified entity column is an enum and if so, whether the specified value is valid.
    """

    enums = get_enums(entity, field_name)

    if enums:
        mapper = get_mapper(entity)

        try:
            value_is_a_valid_null = (
                mapper.columns[field_name].nullable and value is None
            )

        except AttributeError:
            abort(
                400,
                description=f"'{field_name}' is not in table '{mapper.mapped_table.name}'",
            )

        if value not in enums and not value_is_a_valid_null:
            abort(
                400,
                description=f"'{value}' is not a valid value for field '{field_name}'",
            )

    return True


def get_enums(entity: db.Model, field: str) -> List[str] or None:
    """return the enums for the specified field or None if the field is not enum or doesn't exist on the model/instance"""
    mapper = get_mapper(entity)
    try:
        if isinstance(mapper.columns[field].type, SqlAlchemyEnum):
            return mapper.columns[field].type.enums
        else:
            return None
    except AttributeError:
        return None


def check_admin(handler):
    @wraps(handler)
    def decorated_handler(*args, **kwargs):
        with app.app_context():
            if app.config.get("LOGIN_DISABLED") or current_user.is_admin:
                return handler(*args, **kwargs)
        return "Unauthorized", 401

    return decorated_handler


def validate_json(handler):
    @wraps(handler)
    def decorated_handler(*args, **kwargs):
        """validate content-type header and run optional Validator on input"""
        if request.headers.get("Content-Type") != "application/json":
            abort(415, description="Content-Type must be application/json")
        return handler(*args, **kwargs)

    return decorated_handler


# Support general paged query parameters
def paged(handler):
    @wraps(handler)
    def decorated_handler(*args, **kwargs):
        with app.app_context():
            # for some reason type=int doesn't catch non-integer queries, only returning None
            try:
                page = int(request.args.get("page", default=0))
                if page < 0:  # zero-indexed pages
                    raise ValueError
            except:
                abort(400, description="page must be a non-negative integer")
            try:
                limit = request.args.get("limit")
                if limit is not None:  # unspecified limit means return everything
                    limit = int(limit)
                    if limit <= 0:  # MySQL accepts 0 but that's just a waste of time
                        raise ValueError
            except:
                abort(400, description="limit must be a positive integer")
            return handler(*args, **kwargs, page=page, limit=limit)

    return decorated_handler


def transaction_or_abort(callback: Callable) -> None:
    try:
        callback()
    except exc.DataError as err:
        db.session.rollback()
        abort(400, description=err.orig.args[1])
    except exc.StatementError as err:
        db.session.rollback()
        abort(400, description=str(err.orig))
    except Exception as err:
        db.session.rollback()
        raise err


def filter_in_enum_or_abort(column: db.Column, Allowed: Enum, values: str):
    try:
        return column.in_([Allowed(e) for e in values.split(",")])
    except ValueError as err:  # Invalid enum value
        abort(400, description=err)


def filter_nullable_bool_or_abort(column: db.Column, value: str):
    if value == "null":
        return column == None
    elif value == "true":
        return column == True
    elif value == "false":
        return column == False
    else:
        abort(400, description=f"{column.name} must be true, false, or null")


def filter_updated_or_abort(column: db.Column, value: str):
    description = "updated must be of the form before/after,iso-datetime"
    updated = value.split(",")
    if len(updated) != 2:
        abort(400, description=description)
    try:
        updated[1] = datetime.fromisoformat(updated[1])
    except ValueError as err:  # bad datetime format
        abort(400, description=err)
    if updated[0] == "before":
        return column <= updated[1]
    elif updated[0] == "after":
        return column >= updated[1]
    else:
        abort(400, description=description)


def get_minio_admin() -> MinioAdmin:
    return MinioAdmin(
        endpoint=app.config["MINIO_ENDPOINT"],
        access_key=app.config["MINIO_ACCESS_KEY"],
        secret_key=app.config["MINIO_SECRET_KEY"],
    )


def query_results_to_csv(results: List[dict or dataclass]):
    """take a list of models and convert to csv"""
    is_dict = isinstance(results[0], dict)

    if not is_dict:
        results = [asdict(result) for result in results]

    colnames = results[0].keys()

    csv_data = StringIO()
    writer = DictWriter(
        csv_data,
        fieldnames=colnames,
        quoting=QUOTE_MINIMAL,
    )
    writer.writeheader()
    for row in results:
        if isinstance(row, Model):
            row = asdict(row)
        writer.writerow(row)

    return csv_data.getvalue()


def paginated_response(results: List[Any], page: int, total: int, limit: int = None):
    return jsonify(
        {
            "data": results,
            "page": page if limit else 0,
            "total_count": total,
        }
    )


def update_last_login(user: User = None):
    """
    Update last login for given user and return login details.
    Use current_user if no user is specified.
    """
    if not user:
        user = current_user  # type: ignore

    last_login = None
    try:
        last_login = user.last_login
        user.last_login = datetime.now()
        db.session.commit()
        app.logger.info("Last login for '%s' updated..", user.username)
    except:
        app.logger.warning("Failed to updated last_login for '%s'", user.username)

    return jsonify(
        {
            "username": user.username,
            "last_login": last_login,
            "is_admin": user.is_admin,
            "groups": [group.group_code for group in user.groups],
        }
    )


def csv_response(
    results: List[Dict[str, Any]] or List[Model],
    filename: str = "report",
    colnames: List[str] = None,
):
    """create a csv HTTP response from a list of query results or mapping"""

    if colnames:
        results = filter_keys_and_reorder(results, colnames)

    csv = query_results_to_csv(results)

    return send_file(
        BytesIO(csv.encode("utf-8")),
        "text/csv",
        as_attachment=True,
        download_name=filename,
    )


def filter_keys_and_reorder(data: List[Dict[str, Any]] or List[Model], keys: List[str]):
    """filter list item mappings and key order according to list of keys"""
    return [{key: row[key] for key in keys} for row in data]


def expects_json(req: Request):
    return not req.accept_mimetypes or "application/json" in req.accept_mimetypes


def expects_csv(req: Request):
    return "text/csv" in req.accept_mimetypes


# https://stackoverflow.com/a/55991358
def clone_entity(model_object, **kwargs):
    """
    Clone an arbitrary sqlalchemy entity (eg. from a query.first()) without its primary key values.
    """

    table = model_object.__table__
    non_pk_columns = [k for k in table.columns.keys() if k not in table.primary_key]
    data = {c: getattr(model_object, c) for c in non_pk_columns}
    data.update(kwargs)

    clone = model_object.__class__(**data)
    return clone


def stager_is_keycloak_admin():
    """
    Return true if OIDC is enabled and if Stager is using a Keycloak
    instance with administrative access.

    In other words, return true if Stager has the ability to create users in Keycloak.
    """
    return app.config.get("ENABLE_OIDC") and getenv("KEYCLOAK_HOST") is not None


class DateTimeEncoder(JSONEncoder):
    """
    JSONEncoder override for encoding UTC datetimes in ISO format.
    """

    def default(self, obj):

        # handle any variant of date
        if isinstance(obj, (date, time, datetime)):
            return obj.isoformat()

        # default behaviour
        return JSONEncoder.default(self, obj)


def find(collection: Iterable[Mapping[str, Any]], pred: Callable):
    """find an item in a collection"""
    try:
        return next((item for item in collection if pred(item)))
    except StopIteration:
        return None


def get_current_user():
    """if the user is an admin or login is disabled, a user's identity can be assumed by passing an id via the query string"""
    app.logger.debug("Getting user")

    user_id = request.args.get("user")

    user = current_user

    if app.config.get("LOGIN_DISABLED") and not user_id:
        abort(400, description="A user ID must be provided when login is disabled!")

    if app.config.get("LOGIN_DISABLED") or current_user.is_admin:
        if user_id:
            user = User.query.filter(User.user_id == user_id).first()
            if not user:
                abort(400, description="Provided user does not exist!")

    app.logger.debug("user_id: '%s'", getattr(user, "user_id", None))

    return user


def filter_datasets_by_user_groups(query: Query, user: User):
    """
    attach a subquery that removes datasets that don't share groups with the user
    this function assumes that the query already includes a selection for models.Dataset
    """
    user_group_subquery = (
        Group.query.join(Group.users)
        .filter(User.user_id == user.user_id)
        .with_entities(Group.group_id)
        .subquery()
    )

    dataset_subquery = (
        Dataset.query.join(Dataset.groups)
        .filter(Group.group_id.in_(user_group_subquery))
        .with_entities(Dataset.dataset_id)
        .subquery()
    )

    return query.filter(Dataset.dataset_id.in_(dataset_subquery))
