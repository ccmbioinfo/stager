from app import app, db, models

@app.cli.command('add-default-admin')
def add_default_admin():
    if len(db.session.query(models.User).all()) == 0:
        default_admin = models.User(
            username=app.config.get('DEFAULT_ADMIN'),
            email=app.config.get('DEFAULT_ADMIN_EMAIL')
        )
        default_admin.set_password(app.config.get('DEFAULT_PASSWORD'))
        db.session.add(default_admin)
        db.session.commit()
        print('Created default user "{}" with email "{}"'.format(
            default_admin.username, default_admin.email))

@app.cli.command('add-dummy-data')
def add_dummy_data():
    pass
