from flask import current_app as app
from slurm_rest import ApiClient, ApiException
from slurm_rest.apis import SlurmApi
from slurm_rest.models import V0037JobSubmission, V0037JobProperties

from .models import Analysis


def run_pipeline(analysis: Analysis):
    # Hello world example. Move to a job queue if it blocks requests for too long
    if app.config["slurm"]:
        with ApiClient(app.config["slurm"]) as api_client:
            api_instance = SlurmApi(api_client)
            try:
                flat_datasets = "\n".join(
                    [
                        f"echo '{dataset.tissue_sample.participant.family.family_codename}/{dataset.tissue_sample.participant.participant_codename}/{dataset.dataset_type} ({dataset.dataset_id})'"
                        for dataset in analysis.datasets
                    ]
                )
                submitted_job = api_instance.slurmctld_submit_job(
                    V0037JobSubmission(
                        script=f"""#!/bin/bash
echo Running Stager analysis {analysis.analysis_id}...
{flat_datasets}
# Call back
""",
                        job=V0037JobProperties(
                            environment={},
                            current_working_directory=f"/home/{app.config['slurm'].api_key['user']}",
                        ),
                    )
                )
                app.logger.info(submitted_job)
                analysis.scheduler_id = submitted_job.job_id
                # TODO: either commit only now or commit again, column should be renamed since this isn't Torque
            except ApiException as e:
                app.logger.warn("Exception when calling slurmctld_submit_job: %s\n" % e)
