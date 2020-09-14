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
        default_families = [
            {'family_codename': '1000', 'created_by': 1, 'updated_by': 1},
            {'family_codename': '1001', 'created_by': 1, 'updated_by': 1},
        ]
        for f in default_families:
            family = models.Family(
                family_codename = f['family_codename'],
                created_by = f['created_by'],
                updated_by = f['updated_by']
            )
            db.session.add(family)

        db.session.commit()
        print('Created default families: {}'.format(", ".join([a['family_codename'] for a in default_families])))

    # add participants
    if len(db.session.query(models.Participant).all()) == 0:
        # codename is key, sex, type
        default_participants = [
            {'family_id': 1, 'codename': 'AA001', 'sex': 'Female', 'type': 'Proband', 'affected': True, 'notes': 'Extra info about sample here', 'created_by': 1, 'updated_by': 1},
            {'family_id': 1, 'codename': 'AA002', 'sex': 'Male', 'type': 'Father', 'affected': False, 'notes': '', 'created_by': 1, 'updated_by': 1},
            {'family_id': 1, 'codename': 'AA003', 'sex': 'Female', 'type': 'Mother', 'affected': False, 'notes': '', 'created_by': 1, 'updated_by': 1},
        ]
        for p in default_participants:
            participant = models.Participant(
                family_id = p['family_id'],
                participant_codename = p['codename'],
                sex = p['sex'],
                participant_type = p['type'],
                affected = p['affected'],
                notes = p['notes'],
                created_by = p['created_by'],
                updated_by = p['updated_by']
            )
            db.session.add(participant)

        db.session.commit()
        print('Created default participants: {}'.format(", ".join([a['codename'] for a in default_participants])))


    # add tissue samples
    if len(db.session.query(models.TissueSample).all()) == 0:
        default_tissues = [
            {'participant_id': 1,  'extraction_date': '2020-01-04', 'tissue_sample_type': 'Blood', 'created_by': 1, 'updated_by': 1},
            {'participant_id': 2,  'extraction_date': '2020-01-04', 'tissue_sample_type': 'Blood', 'created_by': 1, 'updated_by': 1},
            {'participant_id': 3,  'extraction_date': '2020-01-04', 'tissue_sample_type': 'Blood', 'created_by': 1, 'updated_by': 1}
        ]
        for t in default_tissues:
            tissue = models.TissueSample(
                participant_id = t['participant_id'],
                extraction_date = t['extraction_date'],
                tissue_sample_type = t['tissue_sample_type'],
                created_by = t['created_by'],
                updated_by = t['updated_by']
            )
            db.session.add(tissue)

        db.session.commit()
        print("Created default tissue samples: {}".format(", ".join([t['tissue_sample_type']+" for Participant "+str(t['participant_id']) for t in default_tissues])))

    # add dataset
    if len(db.session.query(models.Dataset).all()) == 0:
        default_datasets = [
            {'tissue_sample_id': 1, 'dataset_type': 'RGS', 'entered': '2020-02-03', 'created_by': 1, 'condition': 'Germline', 'input_hpf_path': ''},
            {'tissue_sample_id': 2, 'dataset_type': 'RGS', 'entered': '2020-02-03', 'created_by': 1, 'condition': 'Germline', 'input_hpf_path': ''},
            {'tissue_sample_id': 3, 'dataset_type': 'RGS', 'entered': '2020-02-03', 'created_by': 1, 'condition': 'Germline', 'input_hpf_path': ''}
        ]
        for d in default_datasets:
            dataset = models.Dataset(
                tissue_sample_id = d['tissue_sample_id'],
                dataset_type = d['dataset_type'],
                condition = d['condition'],
                created_by = d['created_by'],
                updated_by = d['created_by'],
                created = d['entered'],
                sequencing_centre = 'CHEO', #TODO: remove
                extraction_protocol = 'Something' #TODO: remove
            )
            db.session.add(dataset)

        db.session.commit()
        print("Created default datasets: {}".format(", ".join([d['dataset_type']+" for TissueSample"+str(d['tissue_sample_id']) for d in default_datasets])))

    # add pipelines
    if len(db.session.query(models.Pipeline).all()) == 0:
        default_pipelines = [
            {"pipeline_name": "CRG", "pipeline_version": "1.2"},
            {"pipeline_name": "CRE", "pipeline_version": "4.3"}
        ]
        for p in default_pipelines:
            pipeline = models.Pipeline(
                pipeline_name = p["pipeline_name"],
                pipeline_version = p["pipeline_version"]
            )
            db.session.add(pipeline)

        db.session.commit()
        print("Created default pipelines: {}".format(", ".join([p['pipeline_version'] for p in default_pipelines])))

    # add analyses
    if len(db.session.query(models.Analysis).all()) == 0:
        default_analyses = [
            {'analysis_state': "Running", "pipeline_id": 1, "assignee": 1, "requester": 1, "requested": "2020-07-28", "started": "2020-08-04", "updated": "2020-08-04", "updated_by": 1},
            {'analysis_state': "Requested", "pipeline_id": 2, "assignee": 1, "requester": 1, "requested": "2020-08-10", "started": None, "updated": "2020-08-10", "updated_by": 1}
        ]
        for a in default_analyses:
            analysis = models.Analysis(
                analysis_state = a['analysis_state'],
                pipeline_id = a['pipeline_id'],
                assignee = a['assignee'],
                requester = a['requester'],
                requested = a['requested'],
                started = a['started'],
                updated = a['updated'],
                updated_by = a['updated_by']
            )
            db.session.add(analysis)

        db.session.commit()
        print("Created default analysis with states: {}".format(", ".join([a['analysis_state'] for a in default_analyses])))

    # need to add to the users_groups, groups_datasets, and datasets_analyses tables as well










