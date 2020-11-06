import { Counts, KeyValue, Analysis, PipelineStatus, Dataset, Info } from "./typings";

export function countArray(items: string[]) {
    return items.reduce<Counts>((counts, item) => {
        if (counts[item]) {
            counts[item] += 1;
        } else {
            counts[item] = 1;
        }
        return counts;
    }, Object.create(null));
}

export function toKeyValue(items: string[]) {
    return items.reduce<KeyValue>((map, item) => {
        map[item] = item;
        return map;
    }, Object.create(null));
}

/**
 * Return a date string in the format "YYYY-MM-DD", if possible.
 *
 * @param {string} date Datestring of the form: "Day, DD Mon YYYY HH:MM:SS GMT"
 */
export function formatDateString(date: string) {
    const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
    ];
    // Pretty general datestring because we trust the server to send a good one
    const regex = /^[A-Z][a-z]{2}, (\d{2}) ([A-Z][a-z]{2}) (\d{4}) \d{2}:\d{2}:\d{2} GMT$/;
    const result = regex.exec(date);
    if (result) {
        let [year, month, day] = [result[3], "" + (months.indexOf(result[2]) + 1), result[1]];
        if (month.length < 2) month = "0" + month;
        return [year, month, day].join("-");
    }
    return date;
}

/**
 * Convert the provided JSON Array to a valid array of Analysis.
 */
export function jsonToAnalyses(data: Array<any>): Analysis[] {
    const rows: Analysis[] = data.map((row, index, arr) => {
        switch (row.analysis_state) {
            case "Requested":
                row.state = PipelineStatus.PENDING;
                break;
            case "Running":
                row.state = PipelineStatus.RUNNING;
                break;
            case "Done":
                row.state = PipelineStatus.COMPLETED;
                break;
            case "Error":
                row.state = PipelineStatus.ERROR;
                break;
            case "Cancelled":
                row.state = PipelineStatus.CANCELLED;
                break;
            default:
                row.state = null;
                break;
        }
        return { ...row } as Analysis;
    });
    return rows;
}

/**
 * Get the index of a material-table row.
 * If a material-table row is not provided, return null.
 */
export function getRowIndex(row: any): number | null {
    return row.tableData?.id;
}

/**
 * Return whether this material-table row is checked / selected.
 * If it is not a material-table row, return null.
 */
export function isRowSelected(row: any): boolean {
    return !!row?.tableData?.checked;
}

/**
 * Return the titles of analysis detail in dialogs
 */
export function getAnalysisTitles() {
    return [
        "Analysis ID",
        "State",
        "Pipeline ID",
        "Assigned to",
        "HPF Path",
        "qSub ID",
        "Notes",
        "Requested",
        "Requested By",
        "Started",
        "Last Updated",
    ];
}

/**
 * Return the values of analysis detail in dialogs
 */
export function getAnalysisValues(analysis: Analysis) {
    return [
        analysis.analysis_id,
        analysis.analysis_state,
        analysis.pipeline_id,
        analysis.assignee,
        analysis.result_hpf_path,
        analysis.qsubID,
        analysis.notes,
        formatDateString(analysis.requested),
        analysis.requester,
        formatDateString(analysis.started),
        formatDateString(analysis.updated),
    ];
}

/**
 * Return an Info object for anlysis detail list in dialogs
 */
export function getAnlysisInfoList(analyses: Analysis[]) {
    return analyses.map(analysis => {
        return {
            primaryListTitle: `Analysis ID ${analysis.analysis_id}`,
            secondaryListTitle: `Current State: ${analysis.analysis_state} - Click for more details`,
            titles: getAnalysisTitles(),
            values: getAnalysisValues(analysis),
        } as Info;
    });
}

/**
 * Return the titles of dataset detail in dialogs
 */
export function getDatasetTitles() {
    return [
        "Dataset ID",
        "Dataset Type",
        "Participant Codename",
        "Family Codename",
        "Tissue ID",
        "Sequencing Centre",
        "Notes",
        "Created",
        "Created By",
        "Updated",
        "Updated By",
    ];
}

/**
 * Return the values of dataset detail in dialogs
 */
export function getDatasetValues(dataset: Dataset) {
    return [
        dataset.dataset_id,
        dataset.dataset_type,
        dataset.participant_codename,
        dataset.family_codename,
        dataset.tissue_sample_id,
        dataset.sequencing_centre,
        dataset.notes,
        formatDateString(dataset.created),
        dataset.created_by,
        formatDateString(dataset.updated),
    ];
}

/**
 * Return the secondary titles (hidden in show more detail) of dataset detail in dialogs
 */
export function getSecDatasetTitles() {
    return [
        "Batch ID",
        "HPF Path",
        "Condition",
        "Extraction Protocol",
        "Capture Kit",
        "Discriminator",
        "Library Prep Method",
        "Library Prep Date",
        "Read Length",
        "Read Type",
        "Sequencing ID",
    ];
}

/**
 * Return the secondary values (hidden in show more detail) of dataset detail in dialogs
 */
export function getSecDatasetValues(dataset: Dataset) {
    return [
        dataset.batch_id,
        dataset.input_hpf_path,
        dataset.condition,
        dataset.extraction_protocol,
        dataset.capture_kit,
        dataset.discriminator,
        dataset.library_prep_method,
        formatDateString(dataset.library_prep_date),
        dataset.read_length,
        dataset.read_type,
        dataset.sequencing_id,
    ];
}

/**
 * Return an Info object for dataset detail list in dialogs
 */
export function getDatasetInfoList(datasets: Dataset[]) {
    return datasets.map(dataset => {
        return {
            primaryListTitle: `Dataset ID ${dataset.dataset_id}`,
            secondaryListTitle: `Participant: ${dataset.participant_codename} - Click for more details`,
            titles: getDatasetTitles(),
            values: getDatasetValues(dataset),
            collapsibleTitles: getSecDatasetTitles(),
            collapsibleValues: getSecDatasetValues(dataset),
        } as Info;
    });
}
