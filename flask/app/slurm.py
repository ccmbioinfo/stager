import json
from typing import Optional

from flask import current_app as app
from slurm_rest import ApiClient, ApiException
from slurm_rest.apis import SlurmApi
from slurm_rest.models import (
    V0037JobSubmission,
    V0037JobProperties,
    V0037JobSubmissionResponse,
)

from .models import Analysis


# Slurm notes:
#   environment and cwd are required job properties at minimum
#   by default, stdout is captured and written to {cwd}/slurm-{id}.out as the executing user
#   "~" in job script expands to /var/run/slurmrest
#   job script itself is written to /var/spool/slurm/d/job{id}/slurm_script
#   job script runs in a login shell


def run_crg2_on_family(analysis: Analysis) -> Optional[V0037JobSubmissionResponse]:
    """
    Precondition: this analysis is a valid trio-ish analysis and has relevant relationships loaded
    """
    # Move to a job queue if it blocks requests for too long
    datasets = analysis.datasets
    family_codename = datasets[0].tissue_sample.participant.family.family_codename
    family_codename = family_codename.replace("'", "\\'")  # escape quotes for shell
    files = {
        dataset.tissue_sample.participant.participant_codename: [
            file.path for file in dataset.linked_files
        ]
        for dataset in datasets
    }
    # Will only be used for capturing stdout/stderr instead of explicitly for each
    cwd = app.config["SLURM_PWD"]
    with ApiClient(app.config["slurm"]) as api_client:
        api_instance = SlurmApi(api_client)
        try:
            # This should already be safely shell-escaped so there's no arbitrary code execution
            # but if there are further issues then pass the user inputs in through the environment
            submitted_job = api_instance.slurmctld_submit_job(
                V0037JobSubmission(
                    script=f"""#!/bin/bash
exec '{app.config["CRG2_ENTRYPOINT"]}' {analysis.analysis_id} '{family_codename}' '{json.dumps(files)}'
""",
                    job=V0037JobProperties(
                        environment={},
                        current_working_directory=cwd,
                        name=f"Stager-CRG2 (analysis {analysis.analysis_id}, family {family_codename})",
                        memory_per_node=4096,  # MB, equivalent to --mem and SBATCH_MEM_PER_NODE
                        time_limit=3000,  # minutes, 50 hours, equivalent to --time and SBATCH_TIMELIMIT
                        # partition, nodes, and CPUs are left implied
                    ),
                )
            )
            app.logger.info(
                f"Submitted analysis {analysis.analysis_id} to scheduler: {submitted_job}"
            )
            return submitted_job
        except ApiException as e:
            app.logger.warn(
                f"Exception when calling slurmctld_submit_job for analysis {analysis.analysis_id}",
                exc_info=e,
            )
