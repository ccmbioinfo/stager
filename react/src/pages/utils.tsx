import React, { forwardRef, ReactElement, Ref } from "react";
import { Slide } from "@material-ui/core";
import { TransitionProps } from "@material-ui/core/transitions";

export const SlideUpTransition = forwardRef((
    props: TransitionProps & { children?: ReactElement },
    ref: Ref<unknown>,
) => <Slide direction="up" ref={ref} {...props} />);

export type Counts = { [key: string]: number };
export type KeyValue = { [key: string]: string };

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

export interface Participant {
    participant_id: string,
    participant_codename: string,
    family_id: string,
    family_codename: string,
    participant_type: string,
    affected: boolean,
    solved: boolean,
    sex: string,
    notes: string,
    dataset_types: string[],
    created: string,
    created_by: number,
    updated: string,
    updated_by: number,
    tissue_samples: Sample[]
}

export interface Sample {
    sampleID: string,
    extractionDate: string,
    sampleType: string,
    tissueProcessing: string,
    datasets: Dataset[],
    notes: string,
    created: string,
    createBy: number,
    updated: string,
    updatedBy: number,
}

export interface Dataset {
    dataset_id: string,
    participant_codename: string,
    family_codename: string,
    tissue_sample_type: string,
    tissue_sample_id: string,
    dataset_type: string,
    input_hpf_path: string,
    notes: string,
    condition: string,
    extraction_protocol: string,
    capture_kit: string,
    library_prep_method: string,
    library_prep_date: string,
    read_length: number,
    read_type: string,
    sequencing_id: string,
    sequencing_centre: string,
    batch_id: string,
    created: string,
    created_by: number,
    updated: string,
    updated_by: number,
    discriminator: string,
}

export interface Analysis {
    analysis_id: string;
    pipeline_id: string; // Display pipeline name?
    result_hpf_path: string;
    assignee: string;  // show ID or username?
    requester: string; // show ID or username?
    state: PipelineStatus;
    updated: string; // Date type maybe?
    notes: string;
    selected: boolean;
    
    datasetID?: string,
    analysisState?: string,
    qsubID?: string,
    requested?: string,
    started?: string,
    finished?: string,
    updatedBy?: number,
}


export enum PipelineStatus {
    PENDING = "Pending",
    RUNNING = "Running",
    COMPLETED = "Completed",
    ERROR = "Error",
    CANCELLED = "Cancelled"
}
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
    "Dec"
];

/**
 * Return a date string in the format "YYYY-MM-DD", if possible.
 *
 * @param {string} date Datestring of the form: "Day, DD Mon YYYY HH:MM:SS GMT"
 */
export function formatDateString(date: string) {
    // Pretty general datestring because we trust the server to send a good one
    const regex = /^[A-Z][a-z]{2}, (\d{2}) ([A-Z][a-z]{2}) (\d{4}) \d{2}:\d{2}:\d{2} GMT$/
    const result = regex.exec(date);
    if (result) {
        let [year, month, day] = [result[3], '' + (months.indexOf(result[2]) + 1), result[1]];
        if (month.length < 2)
            month = '0' + month;
        return [year, month, day].join('-');
    }
    return date;
}

export const emptyCellValue = "<empty>";
