import json

from flask import request
from flask_login import login_user, logout_user, current_user, login_required

from app import app, db, login, models


@login.user_loader
def load_user(uid: int):
    return models.User.query.get(uid)


if len(db.session.query(models.User).all()) == 0:
    default_admin = models.User(
        username=app.config.get('DEFAULT_ADMIN'),
        email=app.config.get('DEFAULT_ADMIN_EMAIL')
    )
    default_admin.set_password(app.config.get('DEFAULT_PASSWORD'))
    db.session.add(default_admin)
    db.session.commit()
    print("Created default user " + default_admin)


@app.route('/api/login', methods=['POST'])
def login():
    if current_user.is_authenticated:
        return '', 204

    body = request.json
    if not body:
        return 'Request body must be correctly-shaped JSON!', 400

    user = models.User.query.filter_by(username=body['username']).first()
    if user is None or not user.check_password(body['password']):
        return 'Unauthorized', 401
    login_user(user)
    return 'Authenticated', 200


@app.route('/api/logout', methods=['POST'])
@login_required
def logout():
    if not request.json:
        return 'Request body must be JSON!', 400
    logout_user()
    return '', 204
