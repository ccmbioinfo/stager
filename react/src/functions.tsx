import React from "react";
import dayjs from "dayjs";
import LocalizedFormat from "dayjs/plugin/localizedFormat";
import utc from "dayjs/plugin/utc";
import {
    Analysis,
    Counts,
    Dataset,
    Field,
    FieldDisplayValueType,
    Info,
    isRNASeqDataset,
    KeyValue,
    PipelineStatus,
    PseudoBoolean,
    PseudoBooleanReadableMap,
    SearchType,
} from "./typings";

dayjs.extend(utc);
dayjs.extend(LocalizedFormat);

export function countArray(items: string[]) {
    return items.reduce<Counts>((counts, item) => {
        if (counts[item]) {
            counts[item] += 1;
        } else {
            counts[item] = 1;
        }
        return counts;
    }, {});
}

export function toKeyValue(items: string[]) {
    return items.reduce<KeyValue>((map, item) => {
        map[item] = item;
        return map;
    }, {});
}

/**
 * Convert an ISO datetime to human-readable format in the user's locale.
 */
export function formatDateString(date: string) {
    const datetime = dayjs.utc(date);
    return datetime.isValid() ? datetime.format("LLLL") : null;
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
 * Return whether this material-table row is checked / selected.
 * If it is not a material-table row, return null.
 */
export function isRowSelected(row: any): boolean {
    return !!row?.tableData?.checked;
}

/**
 * Return the titles and values  of analysis detail as a Field Object in dialogs
 */
export function getAnalysisFields(analysis: Analysis) {
    return [
        createFieldObj("State", analysis.analysis_state),
        createFieldObj("Assigned to", analysis.assignee),
        createFieldObj("Path Prefix", analysis.result_path),
        createFieldObj("Notes", analysis.notes),
        createFieldObj("Requested", formatDateString(analysis.requested)),
        createFieldObj("Requested By", analysis.requester),
        createFieldObj("Started", formatDateString(analysis.started)),
        createFieldObj("Last Updated", formatDateString(analysis.updated)),
    ];
}

/**
 * Return an Info object for analysis detail list in dialogs
 */
export function getAnalysisInfoList(analyses: Analysis[]): Info[] {
    return analyses.map(analysis => {
        return {
            primaryListTitle: `Analysis ID ${analysis.analysis_id}`,
            secondaryListTitle: `Current State: ${analysis.analysis_state} - Click for more details`,
            fields: getAnalysisFields(analysis),
            identifier: analysis.analysis_id,
        };
    });
}

/**
 * Return the titles and values of dataset detail as a Field object in dialogs
 */
export function getDatasetFields(dataset: Dataset) {
    return [
        createFieldObj("Dataset Type", dataset.dataset_type, "dataset_type"),
        createFieldObj(
            "Participant Codename",
            dataset.participant_codename,
            "participant_codename",
            true
        ),
        createFieldObj(
            "Participant Aliases",
            dataset.participant_aliases,
            "participant_aliases",
            true
        ),
        createFieldObj("Family Codename", dataset.family_codename, "family_codename", true),
        createFieldObj("Family Aliases", dataset.family_aliases, "family_aliases", true),
        createFieldObj("Permission Groups", dataset.group_code.join(", "), "group_codes", true),
        createFieldObj(
            "Tissue Sample Type",
            dataset.tissue_sample_type,
            "tissue_sample_type",
            true
        ),
        createFieldObj(
            "Sequencing Centre",
            dataset.sequencing_centre,
            "sequencing_centre",
            false,
            100
        ),
        createFieldObj("Notes", dataset.notes, "notes"),
        createFieldObj("Created", formatDateString(dataset.created), "created", true),
        createFieldObj("Created By", dataset.created_by, "created_by", true),
        createFieldObj("Updated", formatDateString(dataset.updated), "updated", true),
        createFieldObj("Updated By", dataset.updated_by, "updated_by", true),
    ];
}

/**
 * Return the secondary titles and values (hidden in show more detail) of dataset detail as a Field object in dialogs
 */
export function getSecDatasetFields(dataset: Dataset) {
    let fields = [
        createFieldObj("Batch ID", dataset.batch_id, "batch_id", false, 50),
        createFieldObj(
            "Linked Files",
            dataset.linked_files.map(f => f.path),
            "linked_files"
        ),
        createFieldObj("Condition", dataset.condition, "condition"),
        createFieldObj(
            "Extraction Protocol",
            dataset.extraction_protocol,
            "extraction_protocol",
            false,
            100
        ),
        createFieldObj("Capture Kit", dataset.capture_kit, "capture_kit", false, 50),
        createFieldObj(
            "Library Prep Method",
            dataset.library_prep_method,
            "library_prep_method",
            false,
            50
        ),
        createFieldObj(
            "Library Prep Date",
            formatDateString(dataset.library_prep_date),
            "library_prep_date"
        ),
        createFieldObj("Read Length", dataset.read_length, "read_length", false, 10),
        createFieldObj("Read Type", dataset.read_type, "read_type"),
    ];

    if (isRNASeqDataset(dataset)) {
        fields = [
            ...fields,
            createFieldObj("VCF Available", dataset.vcf_available, "vcf_available"),
            createFieldObj("Candidate Genes", dataset.candidate_genes, "candidate_genes"),
        ];
    }

    return fields;
}

/**
 * Return an Info object for dataset detail list in dialogs
 */
export function getDatasetInfoList(datasets: Dataset[]): Info[] {
    return datasets.map(dataset => {
        return {
            primaryListTitle: `Dataset ID ${dataset.dataset_id}`,
            secondaryListTitle: `Participant: ${dataset.participant_codename} - Click for more details`,
            fields: getDatasetFields(dataset),
            collapsibleFields: getSecDatasetFields(dataset),
            identifier: dataset.dataset_id,
        };
    });
}

/**
 * Given a string in snake-case (eg. thing_name), returns the string
 * in spaced Title case (eg. Thing Name).
 *
 * Assume that input string is alphanumeric with underscores.
 */
export function snakeCaseToTitle(str: string): string {
    return str.split("_").map(toTitleCase).join(" ");
}

/**
 * Given a string, returns the string with the first letter of each word capitalized
 */
export function toTitleCase(str: string): string {
    return str.replace(/\w\S*/g, txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
}

export function createFieldObj(
    title: string,
    value: FieldDisplayValueType,
    fieldName?: string,
    disableEdit?: boolean,
    maxLength?: number,
    entryError?: boolean
): Field {
    return {
        title,
        value,
        fieldName,
        disableEdit,
        maxLength,
        entryError,
    };
}

export const getKeys = <T extends object>(obj: T) => Object.keys(obj) as (keyof T)[];

/**
 * Convert given table to CSV and downloads it to user.
 */
export const downloadCsv = (filename: string, blob: Blob) => {
    const downloadLink = document.createElement("a");
    const url = URL.createObjectURL(blob);
    downloadLink.href = url;
    downloadLink.download = filename;
    downloadLink.click();
    URL.revokeObjectURL(url);
};

/**
 * Used for material-table exportCSV.
 */
export function rowDataToTable(columnDefs: any[], data: any[]) {
    const headers = columnDefs.map(columnDef => `"${columnDef.field}"`);
    const dataRows = data.map(rowData =>
        columnDefs.map(columnDef => `"${rowData[columnDef.field]}"`)
    );
    return [headers].concat(dataRows) as string[][];
}

/**
 * Alias for the above two functions together. Generates a table given the columnDefs and
 * rowData, and downloads as CSV.
 */
export function exportCSV(columnDefs: any[], data: any[], filename: string) {
    const table = rowDataToTable(columnDefs, data);
    const rows = table.map(row => row.join(",")).join("\r\n");
    const blob = new Blob([rows], {
        type: "text/csv;charset=utf-8",
    });

    downloadCsv(filename, blob);
}

export function stringToBoolean(value: PseudoBoolean) {
    switch (value) {
        case "true":
            return true;
        case "false":
            return false;
        case "null":
            return null;
        default:
            return value;
    }
}

/**
 * Return an object containing the key-value pairs that differ between
 * oldRow and newRow, with the values from newRow.
 *
 * @param newRow
 * @param oldRow
 */
export function rowDiff<T>(newRow: T, oldRow: T | undefined): Partial<T> {
    if (!oldRow) {
        return { ...newRow };
    } else {
        let diffRow: any = {};
        let k: keyof T;
        for (k in oldRow) {
            if (newRow[k] !== oldRow[k]) {
                diffRow[k] = newRow[k];
            }
        }
        return { ...diffRow };
    }
}

/**
 * Formats the provided FieldDisplay value as a user-readable string.
 */
export function formatFieldValue(value: FieldDisplayValueType, nullUnknown: boolean = false) {
    let val = value;
    if (Array.isArray(value)) val = value.join(", ");
    else if (value === null || value === undefined)
        nullUnknown ? (val = PseudoBooleanReadableMap[("" + value) as PseudoBoolean]) : (val = "");
    else if (typeof value === "boolean")
        val = PseudoBooleanReadableMap[("" + value) as PseudoBoolean];
    return val;
}

/**
 * Return true if the string is empty or contains only whitespace, false otherwise.
 */
export function strIsEmpty(str?: string): boolean {
    const testRegex = /\S/g;
    return str ? !testRegex.test(str) : true;
}

/**
 * Update a material-table filter from outside the table
 * MaterialTable holds its own state, so to avoid a rerender and state flush we need to get a handle \
 * on the instance, make imperative updates, and force an internal state change
 */
export const updateTableFilter = (
    tableRef: React.MutableRefObject<any>,
    column: string,
    filterVal: string | string[]
) => {
    if (tableRef.current) {
        const col = tableRef.current.dataManager.columns.find((c: any) => c.field === column);
        if (col) {
            col.tableData.filterValue = filterVal;
            updateFiltersAndRequery(tableRef);
        }
    }
};

export const resetAllTableFilters = (tableRef: React.MutableRefObject<any>) => {
    tableRef.current.dataManager.columns.forEach((col: any) => (col.tableData.filterValue = ""));
    updateFiltersAndRequery(tableRef);
};

export const updateFiltersAndRequery = (tableRef: React.MutableRefObject<any>) => {
    tableRef.current.dataManager.changeApplyFilters(true);
    tableRef.current.dataManager.filterData();
    tableRef.current.onFilterChangeDebounce();
    // sometimes with lots of filters we see timing issues, maybe b/c of mt's internal callbacks?
    // if we move the requery step to the next tick the issues seem to go away
    setTimeout(() => tableRef.current.onQueryChange);
};

/**
 * Update a material-table query from outside the table
 * Material Table has its own state that stores a query object.
 * We want to add an extra property to this object to enable exact match query for participant and family codename.
 */

export const updateSearchTypeAndRequery = (
    tableRef: React.MutableRefObject<any>,
    searchTypeOptions: SearchType
) => {
    const oldQuery = tableRef.current.state.query;
    tableRef.current.state.query = { ...oldQuery, searchType: [searchTypeOptions] };
    tableRef.current.onQueryChange();
};

/**
 * Return a mapping of column ids to column order indexes currently stored by material-table.
 */
export const getTableColumnOrder = (
    tableRef: React.MutableRefObject<any>
): Record<number, number> | null => {
    const cols = tableRef.current?.dataManager.columns as any[] | undefined;
    const result: Record<number, number> = {};
    if (cols) {
        cols.forEach(col => {
            result[col.tableData.id] = col.tableData.columnOrder;
        });
        return result;
    }
    return null;
};

export const checkPipelineStatusChange = (fromState: PipelineStatus, toState: PipelineStatus) => {
    const endStates = [PipelineStatus.COMPLETED, PipelineStatus.ERROR, PipelineStatus.CANCELLED];
    return (
        // End states cannot change to another state
        !endStates.includes(fromState) &&
        // Error or Cancel can happen to non-end states
        (toState === PipelineStatus.ERROR ||
            toState === PipelineStatus.CANCELLED ||
            // Specific state changes
            (toState === PipelineStatus.COMPLETED && fromState === PipelineStatus.RUNNING) ||
            (toState === PipelineStatus.RUNNING && fromState === PipelineStatus.PENDING))
    );
};
