import React from "react";
import dayjs from "dayjs";
import LocalizedFormat from "dayjs/plugin/localizedFormat";
import utc from "dayjs/plugin/utc";
import {
    Analysis,
    Counts,
    Dataset,
    Field,
    Info,
    isRNASeqDataset,
    KeyValue,
    LinkedFile,
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
export function formatDateString(date: string, type: string) {
    const datetime = dayjs.utc(date);
    if (type === "timestamp") return datetime.isValid() ? datetime.format("LLLL") : null;
    else return datetime.isValid() ? datetime.format("ll") : null;
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
 * Return the titles and values of analysis detail as a Field Object in dialogs
 */
export function getAnalysisFields(analysis: Analysis): Field[] {
    return [
        {
            title: "State",
            value: analysis.analysis_state,
            fieldName: "analysis_state",
            editable: false,
        },
        {
            title: "Assigned to",
            value: analysis.assignee,
            fieldName: "assignee",
            editable: false,
        },
        {
            title: "Path Prefix",
            value: analysis.result_path,
            fieldName: "result_path",
            editable: false,
        },
        { title: "Notes", value: analysis.notes, fieldName: "notes", editable: false },
        {
            title: "Requested",
            value: analysis.requested,
            type: "date",
            fieldName: "requested",
            editable: false,
        },
        {
            title: "Requested By",
            value: analysis.requester,
            fieldName: "requester",
            editable: false,
        },
        {
            title: "Started",
            value: analysis.started,
            type: "date",
            fieldName: "started",
            editable: false,
        },
        {
            title: "Last Updated",
            value: analysis.updated,
            type: "date",
            fieldName: "updated",
            editable: false,
        },
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
export function getDatasetFields(dataset: Dataset): Field[] {
    return [
        {
            title: "Dataset Type",
            value: dataset.dataset_type,
            fieldName: "dataset_type",
            editable: true,
        },

        {
            title: "Participant Codename",
            value: dataset.participant_codename,
            fieldName: "participant_codename",
            editable: false,
        },
        {
            title: "Participant Aliases",
            value: dataset.participant_aliases,
            fieldName: "participant_aliases",
            editable: false,
        },
        {
            title: "Family Codename",
            value: dataset.family_codename,
            fieldName: "family_codename",
            editable: false,
        },
        {
            title: "Family Aliases",
            value: dataset.family_aliases,
            fieldName: "family_aliases",
            editable: false,
        },
        {
            title: "Permission Groups",
            value: dataset.group_code.join(", "),
            fieldName: "group_codes",
            editable: false,
        },
        {
            title: "Tissue Sample Type",
            value: dataset.tissue_sample_type,
            fieldName: "tissue_sample_type",
            editable: false,
        },
        {
            title: "Sequencing Centre",
            value: dataset.sequencing_centre,
            fieldName: "sequencing_centre",
            editable: true,
        },
        { title: "Notes", value: dataset.notes, fieldName: "notes", editable: true },
        {
            title: "Created",
            value: dataset.created,
            type: "timestamp",
            fieldName: "created",
            editable: false,
        },
        {
            title: "Created By",
            value: dataset.created_by,
            fieldName: "created_by",
            editable: false,
        },
        {
            title: "Updated",
            type: "timestamp",
            value: dataset.updated,
            fieldName: "updated",
            editable: false,
        },
        {
            title: "Updated By",
            value: dataset.updated_by,
            fieldName: "updated_by",
            editable: false,
        },
    ];
}

/**
 * Return the secondary titles and values (hidden in show more detail) of dataset detail as a Field object in dialogs
 */
export function getSecDatasetFields(dataset: Dataset): Field[] {
    let fields = [
        {
            title: "Batch ID",
            value: dataset.batch_id,
            fieldName: "batch_id",
            editable: true,
            maxLength: 50,
        },
        {
            title: "Linked Files",
            value: dataset.linked_files,
            fieldName: "linked_files",
            type: "linked_files" as "linked_files",
            editable: true,
        },
        { title: "Condition", value: dataset.condition, fieldName: "condition", editable: true },
        {
            title: "Extraction Protocol",
            value: dataset.extraction_protocol,
            fieldName: "extraction_protocol",
            editable: true,
            maxLength: 100,
        },
        {
            title: "Capture Kit",
            value: dataset.capture_kit,
            fieldName: "capture_kit",
            editable: true,
            maxLength: 50,
        },
        {
            title: "Library Prep Method",
            value: dataset.library_prep_method,
            fieldName: "library_prep_method",
            editable: true,
            maxLength: 50,
        },
        {
            title: "Library Prep Date",
            value: dataset.library_prep_date,
            type: "date" as "date",
            fieldName: "library_prep_date",
            editable: true,
        },
        {
            title: "Read Length",
            value: dataset.read_length,
            fieldName: "read_length",
            editable: true,
            maxLength: 10,
        },
        { title: "Read Type", value: dataset.read_type, fieldName: "read_type", editable: true },
    ];

    if (isRNASeqDataset(dataset)) {
        fields = [
            ...fields,
            {
                title: "VCF Available",
                value: dataset.vcf_available,
                fieldName: "vcf_available",
                editable: false,
            },
            {
                title: "Candidate Genes",
                value: dataset.candidate_genes,
                fieldName: "candidate_genes",
                editable: false,
            },
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

type NumberOrString = number | string;
export const groupBy = <T extends { [key: NumberOrString]: any }, K extends keyof T>(
    data: T[],
    key: T[K] extends NumberOrString ? K : never
) => {
    return data.reduce<{ [key: NumberOrString]: T[] }>(
        (acc, curr) => ({
            ...acc,
            [curr[key]]: acc[curr[key]] ? acc[curr[key]].concat(curr) : [curr],
        }),
        {}
    );
};

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
 * Transforms the 'database' value to a user-readable string.
 */
export function formatDisplayValue(field: Field) {
    const { type, value, fieldName } = field;
    if (fieldName === "month_of_birth") {
        return dayjs(value as string).isValid() ? dayjs(value as string).format("YYYY-MM") : "";
    }
    if (type === "linked_files") {
        return (value as LinkedFile[]).map(v => v.path).join(", ");
    } else if (type === "boolean") {
        return PseudoBooleanReadableMap[("" + value) as PseudoBoolean];
    } else if (type === "date" || type === "timestamp") {
        return formatDateString(value as string, type);
    }
    return value;
}

/* Transform input value to value that the database will accept, mainly for dealing with exceptions to standard rules */
export function formatSubmitValue(field: Field) {
    const { type, fieldName, value } = field;
    let val = value;
    if (fieldName === "month_of_birth") {
        val = dayjs(value as string).isValid() ? dayjs(value as string).format("YYYY-MM-1") : null;
    }
    if ((type === "date" || type === "timestamp") && !dayjs(val as string).isValid()) {
        val = null;
    }

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
