import json

from functools import wraps

from flask import request
from flask_login import login_user, logout_user, current_user, login_required

from app import app, db, login, models
from datetime import datetime


def row2dict(row):
    """
    converts an sqlalchemy row into a dictionary, credits to: https://stackoverflow.com/questions/1958219/convert-sqlalchemy-row-object-to-python-dict
    alternative to '.__dict__' which returns an extra '_sa_instance_state' field
    """
    d = {}
    for column in row.__table__.columns:
        d[column.name] = str(getattr(row, column.name))
    return d
    

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


@app.route('/api/participants/<participant_id>', methods = ['PATCH'])
#@login_required 
def update_participants(participant_id):

    body = request.get_json()

    if not body: # ie. is None
        return 'Bad Request', 400
    
    try:
        id = body['participant_id']
    except KeyError:
        return 'Participant ID not found in json body!', 400

    q =  db.session.query(models.Participant.participant_id)\
        .filter_by(participant_id = id)

    if q.scalar() == 1:

        # add time of edit
        body['updated'] = datetime.now()

        excluded_fields = ['participant_id', 'created', 'created_by'] 

        for field in excluded_fields:
            body.pop(field, None)  # we use pop over del since it does not check for existing keys

        q.update(dict(body))

        try:
            db.session.commit()

            # TODO: think this is a TBD until we know exactly what the front end will display? also serialization of enums
            res = db.session.query(models.Participant)\
                .filter(models.Participant.participant_id  == id).first()

            return json.dumps(row2dict(res))
    
        except:
            db.session.rollback()
            return 'Server Error', 500
    else:
        return 'Participant ID not found in Database', 404


# @app.route('/api/datasets/<dataset_id>', methods = ['PATCH'])
# @login_required

# @app.route('/api/analyses/<analysis_id>', methods = ['PATCH'])
# @login_required