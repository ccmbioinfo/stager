import React from "react";
import { Typography, TypographyProps } from "@material-ui/core";

/*****   CONSTANTS   *****/
export const emptyCellValue = "<empty>";

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/*****   TYPINGS   *****/
export type Counts = { [key: string]: number };
export type KeyValue = { [key: string]: string };

/*****   ENUMS   *****/
export enum PipelineStatus {
    PENDING = "Requested",
    RUNNING = "Running",
    COMPLETED = "Done",
    ERROR = "Error",
    CANCELLED = "Cancelled",
}

/*****   INTERFACES   *****/
export interface Participant {
    participant_id: string;
    participant_codename: string;
    family_id: string;
    family_codename: string;
    participant_type: string;
    affected: boolean;
    solved: boolean;
    sex: string;
    notes: string;
    dataset_types: string[];
    created: string;
    created_by: number;
    updated: string;
    updated_by: number;
    tissue_samples: Sample[];
}
export interface Sample {
    tissue_sample_id: string;
    extraction_date: string;
    tissue_sample_type: string;
    tissue_processing: string;
    datasets: Dataset[];
    notes: string;
    created: string;
    created_by: number;
    updated: string;
    updated_by: number;
}
export interface Dataset {
    dataset_id: string;
    participant_codename: string;
    family_codename: string;
    tissue_sample_type: string;
    tissue_sample_id: string;
    dataset_type: string;
    input_hpf_path: string;
    notes: string;
    condition: string;
    extraction_protocol: string;
    capture_kit: string;
    library_prep_method: string;
    library_prep_date: string;
    read_length: number;
    read_type: string;
    sequencing_id: string;
    sequencing_centre: string;
    batch_id: string;
    created: string;
    created_by: number;
    updated: string;
    updated_by: number;
    discriminator: string;
}
export interface Analysis {
    analysis_id: string;
    pipeline_id: string;
    result_hpf_path: string;
    assignee: string;
    requester: string;
    analysis_state: PipelineStatus;
    updated: string;
    notes: string;
    dataset_id: string;
    qsubID: string;
    requested: string;
    started: string;
    finished: string;
    updated_by: number;
}
export interface Pipeline {
    pipeline_id: number;
    pipeline_name: string;
    pipeline_version: string;
    supported_types: string[];
}

export interface DataEntryRowBase {
    family_codename: string,
    participant_codename: string,
    participant_type: string,
    tissue_sample_type: string,
    dataset_type: string,
}

interface DataEntryRowOptional extends DataEntryRowBase {
    sex?: string,
    affected?: boolean,
    solved?: boolean,
    notes?: string,
    condition?: string,
    extraction_protocol?: string,
    capture_kit?: string,
    library_prep_method?: string,
    read_length?: number,
    read_type?: string,
    sequencing_id?: string,
    sequencing_date?: string,
    sequencing_centre?: string,
    batch_id?: string,
}

// Cannot enforce "RNASeq => these values are set" with types
interface DataEntryRowRNASeq extends DataEntryRowOptional {
    RIN?: string,
    DV200?: string,
    concentration?: string,
    sequencer?: string,
    spike_in?: string
}

export type DataEntryRow = DataEntryRowRNASeq;

export interface DataEntryHeader {
    title: string,
    field: keyof DataEntryRow,
    options?: string[]
};

/*****   FUNCTIONS   *****/
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
 * Return property of object at key.
 *
 * @example
 * let obj = { a: 1, b: 2 };
 * let id = "a";
 * getProp(obj, id)          // returns 1
 */
export function getProp<T, K extends keyof T>(obj: T, key: K): T[K] {
    return obj[key];
}

/**
 * Set property of object at key to newValue. Return obj.
 *
 * @example
 * let obj = { a: 1, b: 2 };
 * setProp(obj, "a", 3);     // returns { a: 3, b: 2 }
 * obj.a === 3               // returns true
 */
export function setProp<T, K extends keyof T>(obj: T, key: K, newValue: any) {
    obj[key] = newValue;
    return obj;
}

/**
 * Return a date string in the format "YYYY-MM-DD", if possible.
 *
 * @param {string} date Datestring of the form: "Day, DD Mon YYYY HH:MM:SS GMT"
 */
export function formatDateString(date: string) {
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

/*****   COMPONENTS   *****/

/**
 * Returns a simple Typography JSX element for displaying "title: value".
 */
export function FieldDisplay(
    props: TypographyProps & { title: string; value?: string[] | string | number | null }
) {
    let val = props.value;
    if (Array.isArray(props.value)) val = props.value.join(", ");
    else if (props.value === null || props.value === undefined) val = "";

    return (
        <Typography variant={props.variant ? props.variant : "body1"} gutterBottom>
            <b>{props.title}:</b> {val}
        </Typography>
    );
}
