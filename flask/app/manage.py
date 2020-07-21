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
    # add groups
    if len(db.session.query(models.Group).all()) == 0:
        # group code/name pairs 
        default_groups = {'C4R': 'Care4Rare', 
        'CHEO': "Children's Hospital of Eastern Ontario",
        'BCCH': "BC Children's Hospital",
        'ACH': "Alberta Children's Hospital",
        'SK': "The Hospital for Sick Children"
        }

        for default_code, default_name in default_groups.items():
            group = models.Group(
                group_code = default_code,
                group_name = default_name
            )
            db.session.add(group)
        
        db.session.commit()
        print('Created default groups with codes: {}'.format(", ".join(default_groups)))
    
    # add families
    if len(db.session.query(models.Family).all()) == 0:
        pass
    
    # add participants
    if len(db.session.query(models.Participant.all())) == 0:
        pass

    # add tissue samples
    if len(db.session.query(models.TissueSample.all())) == 0:
        pass

    # add dataset
    if len(db.session.query(models.Dataset.all())) == 0:
        pass

    # add analyses
    if len(db.session.query(models.Analysis.all())) == 0:
        pass

    # add pipelines
    if len(db.session.query(models.Pipeline.all())) == 0:
        pass

    # add pipeline/dataset compatability
    if len(db.session.query(models.PipelineDatasets.all())) == 0:
        pass

    # need to add to the users_groups, groups_datasets, and datasets_analyses tables as well


    







