from datetime import datetime
from enum import Enum
from functools import wraps
import json
from typing import Any, Dict, List, Union
from dataclasses import asdict

from flask import jsonify, request
from flask_login import login_user, logout_user, current_user, login_required
from sqlalchemy import exc
from sqlalchemy.orm import aliased, joinedload

from app import app, db, login, models


@login.user_loader
def load_user(uid: int):
    return models.User.query.get(uid)


@app.route('/api/login', methods=['POST'])
def login():
    last_login = None
    if current_user.is_authenticated:
        # get/update last login
        try:
            last_login = current_user.last_login
            current_user.last_login = datetime.now()
            db.session.commit()
        except:
            app.logger.warning('Failed to updated last_login for %s', current_user.username)

        return jsonify({ "username": current_user.username, "last_login": last_login })

    body = request.json
    if not body or 'username' not in body or 'password' not in body:
        return 'Request body must be correctly-shaped JSON!', 400

    user = models.User.query.filter_by(username=body['username']).first()
    if user is None or not user.check_password(body['password']):
        return 'Unauthorized', 401

    # get/update last login
    try:
        last_login = user.last_login
        user.last_login = datetime.now()
        db.session.commit()
    except:
        app.logger.warning('Failed to updated last_login for %s', user.username)

    login_user(user)
    return jsonify({ "username": user.username, "last_login": last_login })


@app.route('/api/logout', methods=['POST'])
@login_required
def logout():
    if not request.json:
        return 'Request body must be JSON!', 400
    logout_user()
    return '', 204


def check_admin(handler):
    @wraps(handler)
    def decorated_handler(*args, **kwargs):
        if False:
            return 'Unauthorized', 401
        return handler(*args, **kwargs)

    return decorated_handler


def validate_user(request_user: dict):
    if 'username' in request_user:
        if 'password' in request_user and len(request_user['password']):
            return 'confirmPassword' in request_user and request_user['password'] == request_user['confirmPassword']
        return True
    return False


@app.route('/api/users', methods=['GET'])
@login_required
@check_admin
def user_list():
    db_users = db.session.query(models.User).all()
    users = [
        {
            'username': user.username,
            'email': user.email,
            'isAdmin': True
        }
        for user in db_users
    ]
    return json.dumps(users)


@app.route('/api/users', methods=['POST'])
@login_required
@check_admin
def create_user():
    rq_user = request.get_json()
    if not validate_user(rq_user):
        return 'Bad request', 400

    db_user = models.User.query.filter_by(username=rq_user['username']).first()
    if db_user is not None:
        return 'User already exists', 403

    if 'password' not in rq_user or 'email' not in rq_user:
        return 'Bad request', 400

    user = models.User(
        username=rq_user['username'],
        email=rq_user['email']
    )
    user.set_password(rq_user['password'])
    db.session.add(user)
    try:
        db.session.commit()
        return 'Created', 201
    except:
        db.session.rollback()
        return 'Server error', 500


@app.route('/api/users', methods=['PUT'])
@login_required
@check_admin
def update_user():
    rq_user = request.get_json()
    if not validate_user(rq_user):
        return 'Bad request', 400

    db_user = models.User.query.filter_by(username=rq_user['username']).first_or_404()
    if 'password' in rq_user and len(rq_user['password']):
        db_user.set_password(rq_user['password'])
    if 'email' in rq_user:
        db_user.email = rq_user['email']

    try:
        db.session.commit()
        return 'Updated', 204
    except:
        db.session.rollback()
        return 'Server error', 500


@app.route('/api/users', methods=['DELETE'])
@login_required
@check_admin
def delete_user():
    rq_user = request.get_json()
    if not validate_user(rq_user):
        return 'Bad request', 400

    db_user = models.User.query.filter_by(username=rq_user['username']).first_or_404()
    try:
        db.session.delete(db_user)
        db.session.commit()
        return 'Updated', 204
    except:
        db.session.rollback()
        return 'Server error', 500


@app.route('/api/password', methods=['POST'])
@login_required
def change_password():
    params = request.get_json()
    if 'current' not in params or 'password' not in params or \
        'confirm' not in params:
        return 'Bad request', 400

    if params['password'] != params['confirm']:
        return 'Passwords do not match', 400

    if not current_user.check_password(params['current']):
        return 'Incorrect password', 401

    current_user.set_password(params['password'])
    try:
        db.session.commit()
        return 'Updated', 204
    except:
        db.session.rollback()
        return 'Server error', 500


def mixin(entity: db.Model, json_mixin: Dict[str, Any], columns: List[str]) -> Union[None, str]:
    for field in columns:
        if field in json_mixin:
            column = getattr(entity, field)
            value = json_mixin[field]
            if isinstance(column, Enum):
                if not hasattr(type(column), str(value)):
                    allowed = [e.value for e in type(column)]
                    return f'"{field}" must be one of {allowed}'
            setattr(entity, field, value)


@app.route('/api/<model_name>/<int:id>', methods = ['PATCH'])
@login_required
def update_entity(model_name:str, id:int):
    if not request.json:
        return 'Request body must be JSON', 415

    if model_name == 'participants':
        table = models.Participant.query.get(id)
        editable_columns = ['participant_codename', 'sex', 'participant_type',
                             'affected', 'solved', 'notes']
    elif model_name == 'datasets':
        table = models.Dataset.query.get(id)
        editable_columns = ['dataset_type', 'input_hpf_path', 'notes', 'condition',
                            'extraction_protocol', 'capture_kit', 'library_prep_method',
                            'library_prep_date', 'read_length', 'read_type', 'sequencing_id',
                            'sequencing_date', 'sequencing_centre', 'batch_id', 'discriminator'
                            ]
    elif model_name == 'analyses':
        table = models.Analysis.query.get(id)
        editable_columns = ['analysis_state', 'pipeline_id', 'qsub_id', 'result_hpf_path',
                            'assignee','requester', 'requested',  'started','finished',
                            'notes'
                            ]
    else:
        return 'Not Found', 404

    if not table:
         return 'Not Found', 404

    enum_error = mixin(table, request.json, editable_columns)

    if enum_error:
        return enum_error, 400

    try:
        table.updated_by = current_user.user_id
    except:
        pass  # LOGIN_DISABLED

    try:
        db.session.commit()
    except exc.DataError as err:
        db.session.rollback()
        return err.orig.args[1], 400
    except exc.StatementError as err:
        db.session.rollback()
        return str(err.orig), 400
    except Exception as err:
        db.session.rollback()
        raise err

    return jsonify(table)

@app.route('/api/participants', methods=['GET'], endpoint='participants_list')
@login_required
def participants_list():
    db_participants = models.Participant.query.options(
        joinedload(models.Participant.family),
        joinedload(models.Participant.tissue_samples).
        joinedload(models.TissueSample.datasets)
    ).all()

    participants = [
        {
            **asdict(participant),
            'family_codename': participant.family.family_codename,
            'tissue_samples': [
                {
                    **asdict(tissue_sample),
                    'datasets': tissue_sample.datasets
                } for tissue_sample in participant.tissue_samples
            ]
        } for participant in db_participants
    ]
    return jsonify(participants)

@app.route('/api/analyses', methods=['GET'], endpoint='analyses_list')
@login_required
def analyses_list():
    since_date = request.args.get('since', default='0001-01-01T00:00:00-04:00')
    try: 
        since_date = datetime.fromisoformat(since_date)
    except:
        return 'Malformed query date', 400

    u1 = aliased(models.User)
    u2 = aliased(models.User)
    u3 = aliased(models.User)
    db_analyses = db.session.query(models.Analysis, u1, u2, u3).filter(
        models.Analysis.updated >= since_date).join(
        u1, models.Analysis.requester == u1.user_id
    ).join(
        u2, models.Analysis.updated_by == u2.user_id
    ).outerjoin(
        u3, models.Analysis.assignee == u3.user_id
    ).all()

    analyses = [
        {
            **asdict(analysis),
            "requester": requester and requester.username,
            "updated_by": updated_by and updated_by.username,
            "assignee": assignee and assignee.username,
        } for analysis, requester, updated_by, assignee in db_analyses
    ]

    return jsonify(analyses)


@app.route('/api/pipelines', methods=['GET'], endpoint='pipelines_list')
@login_required
def pipelines_list():
    db_pipelines = db.session.query(models.Pipeline).options(
        joinedload(models.Pipeline.supported)
    ).all()

    return jsonify(db_pipelines)


@app.route('/api/datasets', methods=['GET'], endpoint='datasets_list')
@login_required
def datasets_list():
    db_datasets = db.session.query(models.Dataset).options(
        joinedload(models.Dataset.tissue_sample).
        joinedload(models.TissueSample.participant).
        joinedload(models.Participant.family)
    ).all()
    datasets = [
        {
            **asdict(dataset),
            'tissue_sample_type' : dataset.tissue_sample.tissue_sample_type,
            'participant_codename' : dataset.tissue_sample.participant.participant_codename,
            'participant_type' : dataset.tissue_sample.participant.participant_type,
            'sex' : dataset.tissue_sample.participant.sex,
            'family_codename' : dataset.tissue_sample.participant.family.family_codename
        } for dataset in db_datasets
    ]
    return jsonify(datasets)
