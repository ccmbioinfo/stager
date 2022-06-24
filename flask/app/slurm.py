from datetime import datetime
import json
from typing import Optional

from flask import current_app as app, Flask
from requests import Session
from slurm_rest import ApiException
from slurm_rest.apis import SlurmApi
from slurm_rest.models import (
    V0037JobSubmission,
    V0037JobProperties,
    V0037JobSubmissionResponse,
)

from .models import db, Analysis, AnalysisState


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
    files = {
        dataset.tissue_sample.participant.participant_codename: [
            file.path for file in dataset.linked_files
        ]
        for dataset in datasets
    }
    result_path = f"/srv/shared/analyses/exomes/{family_codename}/{analysis.analysis_id}"
    api_instance: SlurmApi = app.extensions["slurm"]
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
                    # Will only be used for capturing stdout/stderr instead of explicitly for each
                    current_working_directory=app.config["SLURM_PWD"],
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


def run_dig2_on_singleton(analysis: Analysis) -> Optional[V0037JobSubmissionResponse]:
    """
    Precondition: this analysis is a valid singleton and has relevant relationships loaded
    """
    # Similar structure as above
    dataset = analysis.datasets[0]
    participant_codename = dataset.tissue_sample.participant.participant_codename
    family_codename = dataset.tissue_sample.participant.family.family_codename
    name = f"{family_codename}_{participant_codename}"
    params = {
        "participant": name,
        "tissue": dataset.tissue_sample.tissue_sample_type,
        "genes": dataset.candidate_genes,
        "vcffile": None,
        "fastq": [file.path for file in dataset.linked_files],
    }
    date.today().strftime("%Y_%m_%d")


    api_instance: SlurmApi = app.extensions["slurm"]
    try:
        # This should already be safely shell-escaped so there's no arbitrary code execution
        # but if there are further issues then pass the user inputs in through the environment
        submitted_job = api_instance.slurmctld_submit_job(
            V0037JobSubmission(
                # Use a login shell and source the entrypoint for the `module` alias.
                # This also automatically sets the umask correctly to 0002.
                script=f"""#!/bin/bash --login
source '{app.config["DIG2_ENTRYPOINT"]}' {analysis.analysis_id} '{json.dumps(params)}'
""",
                job=V0037JobProperties(
                    environment={"STAGER": True},
                    # Will only be used for capturing stdout/stderr instead of explicitly for each
                    current_working_directory=app.config["SLURM_PWD"],
                    name=f"Stager-DIG2 (analysis {analysis.analysis_id} on {name})",
                    standard_output=f"stager-dig2-{name}.out",
                    cpus_per_task=6,  # equivalent to --cpus-per-task
                    memory_per_node=20 * 1024,  # MB
                    time_limit=80 * 60,  # minutes
                    # partition and nodes are left implied
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


def poll_slurm(app: Flask) -> None:
    """
    This is a scheduled background task. Because it runs in a separate thread,
    it pushes an app context for itself.
    """
    with app.app_context():
        running_analyses = Analysis.query.filter(
            Analysis.analysis_state == AnalysisState.Running,
            Analysis.scheduler_id != None,
        ).all()
        app.logger.info(f"Found {len(running_analyses)} running analyses to poll.")
        if len(running_analyses):
            analyses = {
                analysis.scheduler_id: analysis for analysis in running_analyses
            }
            # api_instance.slurmctld_get_job and api_instance.slurmctld_get_jobs
            # are broken due to Slurm not respecting its own OpenAPI schema on the
            # typing of .array_job_id (returns an int 0 for a string type)
            # The autogenerated V0037JobsResponse will reject this
            # api_instance: SlurmApi = app.extensions["slurm"]
            session: Session = app.extensions["slurm-requests"]
            response = session.get(
                app.config["SLURM_ENDPOINT"] + "/slurm/v0.0.37/jobs",
                headers={
                    "X-SLURM-USER-NAME": app.config["SLURM_USER"],
                    "X-SLURM-USER-TOKEN": app.config["SLURM_JWT"],
                },
            )
            response.raise_for_status()
            result = response.json()
            if len(result["errors"]) > 0:
                app.logger.warning(result["errors"])
            for job in result["jobs"]:
                job_id = job["job_id"]
                if job_id not in analyses:
                    continue
                job_state = job["job_state"]
                end_time = datetime.fromtimestamp(job["end_time"])
                # V0037JobResponseProperties
                # https://slurm.schedmd.com/squeue.html#SECTION_JOB-STATE-CODES
                if job_state in [
                    "BOOT_FAIL",
                    "CANCELLED",
                    "DEADLINE",
                    "FAILED",
                    "NODE_FAIL",
                    "OUT_OF_MEMORY",
                    "PREEMPTED",
                    "TIMEOUT",
                ]:
                    analyses[job_id].analysis_state = AnalysisState.Error
                    analyses[job_id].finished = end_time
                    app.logger.warning(
                        f"Slurm {job_id} (analysis {analyses[job_id].analysis_id}): {job_state}"
                    )
                elif job_state == "COMPLETED":
                    analyses[job_id].analysis_state = AnalysisState.Done
                    analyses[job_id].finished = end_time
                    app.logger.info(
                        f"Slurm {job_id} (analysis {analyses[job_id].analysis_id}): {job_state}"
                    )
            db.session.commit()
