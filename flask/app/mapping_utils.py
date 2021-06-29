"""
Various functions for assisting in mapping reports back to and collapsing datasets and analyses in Stager
"""

from glob import glob
import pandas as pd
import os

from sqlalchemy.orm.exc import MultipleResultsFound
from sqlalchemy import or_

from app import models
from app.extensions import db

from typing import List


def get_report_paths(
    results_path: List[str],
    ignore_folders: List[str] = ["calx/", "misc/", "run_statistics/", "database/"],
) -> List[str]:
    """
    Credits to Dennis Kao for the original function
    """
    ignore_folders = set(
        os.path.join(results_path, folder)
        for folder in ["calx/", "misc/", "run_statistics/", "database/"]
    )
    report_paths = []

    for family_prefix_dir in glob(os.path.join(results_path, "*x")):
        print(family_prefix_dir)

        if family_prefix_dir in ignore_folders:
            print("\tIgnoring folder it's in an ignored folder..")
            continue

        # sorted - ascending order
        for family in glob(os.path.join(family_prefix_dir, "*/")):

            # non-clinical and synonymous reports - i wonder if naming convention has changed over the years?
            reports = sorted(
                [
                    report
                    for report in glob(os.path.join(family, "*wes*"))
                    if "clinical" not in report and "synonymous" not in report
                ]
            )

            if len(reports) >= 1:
                report_paths.append(
                    reports[-1]
                )  # latest report since prefix is: yyyy-mm-dd
            else:
                print("No report files found for %s" % family)

    return report_paths


def preprocess_report(
    report: str,
    wes_report_fields: List[str] = [
        "Position",
        "Ref",
        "Alt",
        "Variation",
        "Refseq_change",
        "Depth",
        "Gene",
        "Ensembl_gene_id",
        "Conserved_in_20_mammals",
        "Sift_score",
        "Polyphen_score",
        "Cadd_score",
        "Gnomad_af",
    ],
):
    """
    Adapted from Dennis Kao's original function
    """

    # subsets report and returns samples using 'Zygosity.' columns

    sep = "," if report.endswith(".csv") else "\t"

    try:
        df = pd.read_csv(report, sep=sep)
    except UnicodeDecodeError:
        print("UnicodeDecodeError on %s. Trying latin-1 decoding." % report)
        df = pd.read_csv(report, encoding="latin-1", sep=sep)

    # print(df.shape)

    # these columns are 'wide' wrt the variants
    d = {"Zygosity": [], "Burden": [], "Alt_depths": []}

    # get all columns with Zygosity, Burden, or Alt_depths - these are unique for each participant
    for key in d:
        d[key].extend([col for col in df.columns if col.startswith(key)])

        # get sample names
    samples = [col.replace("Zygosity.", "").strip() for col in d["Zygosity"]]

    # don't need this if we're keeping all columns
    # final_cols = [
    #     col
    #     for col in df.columns
    #     if col in wes_report_fields
    #     or col in [item for sublist in d.values() for item in sublist]
    # ]

    return samples, df


def get_analysis_ids(
    family_codename: str, samples: List[str], verbose: bool = False
) -> List[str]:
    """
    Given a family codename and list of samples from a report, traverses the Family -> Analysis Stager schema, accounting for family and participant aliases,
    to identify whether the metadata structure in the database matches the report and can be collapsed.

    - returns None if family is not found at all
    - Returns 'No match' for a participant if the family is found, but the participant isn't
    - if participant is found, tissue sample is found, and dataset and analysis is found, takes the latest analysis and returns
    an array of length 4 (see below)

    dataset_analysis_d[sample] = (analyses.analysis_id, analyses.updated, analyses.result_path, dataset.dataset_id)

    TODO: return a dict instead of an array -> need to re-factor the variant insertion code
    """

    # traverses hierarchy and obtains latest analysis id for family and participants
    dataset_analysis_d = {}

    fam_codename = family_codename

    print("Family Codename: {}".format(fam_codename))

    try:
        family = models.Family.query.filter(
            or_(
                models.Family.family_codename == fam_codename,
                models.Family.family_aliases.like(fam_codename),
            )
        ).one_or_none()
    except MultipleResultsFound:
        msg = "Multiple family ids found for {}".format(fam_codename)
        if verbose:
            print(msg)
        family = None

    if family is None:
        return None

    for sample in samples:

        sample = str(
            sample.replace(str(fam_codename) + "_", "")
        )  # replaces family name and underscore prefixed to sample
        sample = sample.replace(
            "_", "-"
        )  # if any underscores in the name they are dashes in the database, likely because of the R script used to generate the reports

        if verbose:
            print("\tSample/Participant: {}".format(sample))

        participant_id = models.Participant.query.filter(
            models.Participant.family_id == family.family_id,
            or_(
                models.Participant.participant_codename == sample,
                models.Participant.participant_aliases.like("%{}%".format(sample)),
            ),
        ).value("participant_id")

        if participant_id is None:
            print("\t\tNo match for participant in database")
            dataset_analysis_d[sample] = "No match"
            continue  #     return all ptps in the dict, hopefully doesn't break anything

        if verbose:
            print("\t\tParticipant ID: {}".format(participant_id))

        tissues = models.TissueSample.query.filter(
            models.TissueSample.participant_id == participant_id
        ).all()

        for tissue in tissues:

            if verbose:
                print("\t\tTissue ID: {}".format(tissue.tissue_sample_id))

            datasets = tissue.datasets

            for dataset in datasets:

                if verbose:
                    print("\t\tDataset ID: {}".format(dataset.dataset_id))

                mapped_analysis_ids_gen = (
                    db.session.query(models.datasets_analyses_table)
                    .filter(
                        models.datasets_analyses_table.c.dataset_id
                        == dataset.dataset_id
                    )
                    .values("analysis_id")
                )

                mapped_analysis_ids = [x for x, in mapped_analysis_ids_gen]

                if verbose:
                    print(
                        "\t\tFound {} analysis IDs: {}".format(
                            len(mapped_analysis_ids), mapped_analysis_ids
                        )
                    )

                analyses = (
                    models.Analysis.query.filter(
                        models.Analysis.analysis_id.in_(mapped_analysis_ids)
                    )
                    .order_by(models.Analysis.updated.desc())
                    .first()
                )

                if not analyses:

                    if verbose:
                        print("\t\tNo analyses found for {}".format(dataset))
                    continue

                #                 print(analyses.updated)

                if verbose:
                    print(
                        "\t\tAnalysis ID '{}' is the most recent".format(
                            analyses.analysis_id
                        )
                    )

                # check if the participant already has a dataset. if yes, check when the analysis was updated.
                if dataset_analysis_d.get(sample):

                    if verbose:
                        print("\t\tSample '{}' already has an analysis.".format(sample))
                    if analyses.updated > dataset_analysis_d[sample][1]:
                        if verbose:
                            print("\t\tExisting analysis is newer, not replacing..")
                        continue

                dataset_analysis_d[sample] = (
                    analyses.analysis_id,
                    analyses.updated,
                    analyses.result_path,
                    dataset.dataset_id,
                )
                # dataset_analysis_d[sample] = {'analysis_id': analyses.analysis_id, 'analysis_updated': analyses.updated, 'result_path' : analyses.result_path, 'dataset_id' : dataset.dataset_id}
    return dataset_analysis_d


def check_result_paths(
    dataset_analysis_ids: List[str], samples: List[str], family_codename: str
):
    """
    dataset_analysis_ids - list returned from get_analysis_ids()
    samples - list of samples returned from preprocess_report()
    family_codename - family codename returned from report path


    TODO: return where the check failed for debugging

    - considers families with all paths as NONE as mappable.

    """

    if dataset_analysis_ids is not None:

        # ensure the # of samples in report matches the number of retrieved datasets
        if len(dataset_analysis_ids) == len(samples):

            result_paths = [
                dataset_analysis_ids[ptps][2] for ptps in dataset_analysis_ids
            ]

            # only families where all result paths are not null

            ends_with_bam, ends_in_fam_folder = [
                path.endswith("bam") if path is not None else None
                for path in result_paths
            ], [
                path.endswith(str(family_codename)) if path is not None else None
                for path in result_paths
            ]

            # only families where all result paths end in .bam or the family folder, or all are None
            if all(ends_with_bam) or all(ends_in_fam_folder) or not any(result_paths):

                # need logic to separate out if all ends with bam (which will be the family codename as the last folder)
                # vs all ends in fam codename, which will be the fam prefix + x as the last folder (2x)
                results_list = [
                    os.path.dirname(path) if path is not None else None
                    for path in result_paths
                ]

                result_paths_same = all(x == results_list[0] for x in results_list)

                # only families where all result family paths are the same
                if result_paths_same == True:
                    return True, ends_in_fam_folder
    return False, None
