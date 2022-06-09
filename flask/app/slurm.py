import json
from typing import List, Optional

from flask import current_app as app
from slurm_rest import ApiClient, ApiException
from slurm_rest.apis import SlurmApi
from slurm_rest.models import (
    V0037JobSubmission,
    V0037JobProperties,
    V0037JobSubmissionResponse,
    V0037JobsResponse,
)

from .models import Analysis, AnalysisState


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
                        environment={"STAGER": True},
                        current_working_directory=cwd,
                        name=f"Stager-CRG2 (analysis {analysis.analysis_id}, family {family_codename})",
                        standard_output=f"stager-crg2-{analysis.analysis_id}.out",
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


def poll_slurm() -> None:
    with ApiClient(app.config["slurm"]) as api_client:
        api_instance = SlurmApi(api_client)
        running_analyses = Analysis.query.filter(
            Analysis.analysis_state == AnalysisState.Running,
            Analysis.scheduler_id != None,
        ).all()
        if len(running_analyses):
            analyses = {
                analysis.scheduler_id: analysis for analysis in running_analyses
            }
            requests = [
                api_instance.slurmctld_get_job(analysis.scheduler_id, async_req=True)
                for analysis in running_analyses
            ]
            jobs: List[V0037JobsResponse] = [
                async_result.get() for async_result in requests
            ]
            for job in jobs:
                # V0037JobResponseProperties
                # https://slurm.schedmd.com/squeue.html#SECTION_JOB-STATE-CODES
                if job.jobs[0].job_state in [
                    "BOOT_FAIL",
                    "CANCELLED",
                    "DEADLINE",
                    "FAILED",
                    "NODE_FAIL",
                    "OUT_OF_MEMORY",
                    "PREEMPTED",
                    "TIMEOUT",
                ]:
                    analyses[job.jobs[0].job_id].analysis_state = AnalysisState.Error
                    analyses[job.jobs[0].job_id].result_path = job.jobs[0].job_state
                    analyses[job.jobs[0].job_id].finished = job.jobs[
                        0
                    ].end_time  # int64, convert to datetime?
                elif job.jobs[0].job_state == "COMPLETED":
                    analyses[job.jobs[0].job_id].analysis_state = AnalysisState.Done
                    analyses[job.jobs[0].job_id].finished = job.jobs[
                        0
                    ].end_time  # int64, convert to datetime?
            db.session.commit()
