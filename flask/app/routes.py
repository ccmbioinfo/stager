import json

from functools import wraps

from flask import request
from flask_login import login_user, logout_user, current_user, login_required

from app import app, db, login, models

from datetime import date, datetime


def json_serial(obj):
    """JSON serializer for objects not serializable by default json code"""

    if isinstance(obj, (datetime, date)):
        return obj.isoformat()
    raise TypeError ("Type %s not serializable" % type(obj))

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

@app.route('/api/participant', methods=['GET'], endpoint='partipants_list')
def participants_list():
    db_participants = db.session.query(models.Participant).all()
    participants = [
        {
            'family_codename': participant.family_id,
            'participant_codename': participant.participant_codename,
            'sex': participant.sex,
            'participant_type': participant.participant_type,
            'affected': participant.affected,
            'solved': participant.solved,
            'created': participant.created,
            'created_by': participant.created_by,
            'updated': participant.updated_by,
            'tissue_samples': [
                {
                    'tissue_sample_id': tissue.tissue_sample_id,
                    'participant_id': tissue.participant_id,
                    'extraction_date': tissue.extraction_date,
                    'tissue_sample_type': tissue.tissue_sample_type,
                    'tissue_processing': tissue.tissue_processing,
                    'notes': tissue.notes,
                    'created': tissue.created,
                    'created_by': tissue.created_by,
                    'updated': tissue.updated,
                    'updated_by': tissue.updated_by,
                    'datasets': [
                        {
                          'dataset_id': dataset.dataset_id,
                          'dataset_type': dataset.dataset_type,
                          'input_hpf_path': dataset.input_hpf_path,
                          'notes': dataset.notes,
                          'condition': dataset.condition,
                          'extraction_protocol': dataset.extraction_protocol,
                          'capture_kit': dataset.capture_kit,
                          'library_prep_method': dataset.library_prep_method,
                          'library_prep_date': dataset.library_prep_date,
                          'read_length': dataset.read_length,
                          'read_type': dataset.read_type,
                          'sequencing_id': dataset.sequencing_id,
                          'sequencing_date': dataset.sequencing_date,
                          'sequencing_centre': dataset.sequencing_centre,
                          'batch_id': dataset.batch_id,
                          'created': dataset.created,
                          'updated': dataset.updated,
                          'updated_by': dataset.updated_by,
                          'discriminator': dataset.discriminator,
                          'created_by': dataset.created_by
                        }
                    for dataset in tissue.datasets.all()
                    ]
                }
                for tissue in participant.tissue_samples.all()
                ]

        }
        for participant in db_participants
    ]
    return json.dumps(participants, indent=4, default=str)


@app.route('/api/analyses', methods=['GET'], endpoint='analyses_list')
def analyses_list():
    db_analyses = db.session.query(models.Analysis).all()
    analyses = [
        {
            'analysis_id': analysis.analysis_id,
            'analysis_state': analysis.analysis_state,
            'pipeline_id': analysis.pipeline_id,
            'qsub_id': analysis.qsub_id,
            'result_hpf_path': analysis.result_hpf_path,
            'assignee': analysis.assignee,
            'requester': analysis.requester,
            'requested': analysis.requested,
            'started': analysis.started,
            'finished': analysis.finished,
            'notes': analysis.started,
            'updated': analysis.updated,
            'updated_by': analysis.updated_by
        }
        for analysis in db_analyses
    ]
    return json.dumps(analyses, indent=4, default=json_serial)


@app.route('/api/pipelines', methods=['GET'], endpoint='pipelines_list')
def pipelines_list():
    db_pipelines= db.session.query(models.Pipeline).all()
    pipelines = [
        {
            'pipeline_id': pipeline.pipeline_id,
            'pipeline_name': pipeline.pipeline_name,
            'pipeline_version': pipeline.pipeline_version
        }
        for pipeline in db_pipelines
    ]
    return json.dumps(pipelines, indent=4, default=json_serial)


@app.route('/api/datasets', methods=['GET'], endpoint='datasets_list')
def datasets_list():
    db_datasets= db.session.query(models.Dataset).all()
    datasets = [
            {
                'dataset_id': dataset.dataset_id,
                'dataset_type': dataset.dataset_type,
                'input_hpf_path': dataset.input_hpf_path,
                'notes': dataset.notes,
                'condition': dataset.condition,
                'extraction_protocol': dataset.extraction_protocol,
                'capture_kit': dataset.capture_kit,
                'library_prep_method': dataset.library_prep_method,
                'library_prep_date': dataset.library_prep_date,
                'read_length': dataset.read_length,
                'read_type': dataset.read_type,
                'sequencing_id': dataset.sequencing_id,
                'sequencing_date': dataset.sequencing_date,
                'sequencing_centre': dataset.sequencing_centre,
                'batch_id': dataset.batch_id,
                'created': dataset.created,
                'updated': dataset.updated,
                'updated_by': dataset.updated_by,
                'discriminator': dataset.discriminator,
                'created_by': dataset.created_by
            }
        for dataset in db_datasets
        ]

    return datasets