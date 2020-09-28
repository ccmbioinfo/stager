from datetime import datetime
from enum import Enum
from functools import wraps
import json
from typing import Any, Dict, List, Union

from flask import jsonify, request
from flask_login import login_user, logout_user, current_user, login_required
from sqlalchemy import exc

from app import app, db, login, models


@login.user_loader
def load_user(uid: int):
    return models.User.query.get(uid)


@app.route('/api/login', methods=['POST'])
def login():
    if current_user.is_authenticated:
        return json.dumps({ "username": current_user.username }), 200

    body = request.json
    if not body:
        return 'Request body must be correctly-shaped JSON!', 400

    user = models.User.query.filter_by(username=body['username']).first()
    if user is None or not user.check_password(body['password']):
        return 'Unauthorized', 401
    login_user(user)
    return json.dumps({ "username": user.username }), 200


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
# eg. /api/analyses/1 for analysis table, /api/participants/1 for participants table, and so forth
@login_required
def update_db(model_name:str, id:int):
    if not request.json:
        return 'Request body must be JSON', 415
    print(model_name)
    #return(jsonify(model_name))
    editable_columns = []

    # can these if statements be generalized?
    if model_name == 'participants':
        table = models.Participant.query.get(id)
        editable_columns = ['participant_codename', 'sex', 'participant_type',
                        'affected', 'solved', 'notes']
    elif model_name == 'datasets':
        table = models.Datasets.query.get(id)
        editable_columns = ['dataset_type', 'input_hpf_path', 'notes', 'condition',
                    'extraction_protocol', 'capture_kit', 'library_prep_method',
                    'library_prep_date', 'read_length', 'read_type', 'sequencing_id',
                    'sequencing_date', 'sequencing_centre', 'batch_id', 'discriminator'
                    ]
    elif model_name == 'analyses':
        table = models.Analysis.query.get(id)
        editable_columns = [
                    # I assume most of these will be coupled with the pipeline automation and should be editable
                    'analysis_state', 'pipeline_id', 'qsub_id', 'result_hpf_path',
                    'assignee','requester', 'requested',  'started','finished',
                    'notes'
                    ]
    else:
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

