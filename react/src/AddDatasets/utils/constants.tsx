/**
 * Default Column requirements for our DataEntryTable.
 *
 * May be replaced with some form of config file in the future.
 */

import { DataEntryRow } from "../../typings";
import { ColumnRequirement } from "./typings";

export const rnaSeqColumnFields: (keyof DataEntryRow)[] = [
    "RIN",
    "DV200",
    "concentration",
    "sequencer",
    "spike_in",
];

export const initialColumnRequirements: ColumnRequirement[] = [
    {
        // Default columns that must be filled out
        columns: [
            "family_codename",
            "participant_codename",
            "participant_type",
            "tissue_sample_type",
            "dataset_type",
            "condition",
            "sequencing_date",
        ],
        actions: ["required"],
    },
    {
        // These columns must be filled out for RNASeq rows
        columns: rnaSeqColumnFields,
        actions: ["required"],
        condition: state => state.rows.map(row => row.dataset_type === "RRS"),
    },
    {
        // These columns are disabled for non-RNASeq rows
        columns: rnaSeqColumnFields,
        actions: ["disabled"],
        condition: state => state.rows.map(row => row.dataset_type !== "RRS"),
    },
    {
        // These columns are hidden if there are no RNASeq rows
        columns: rnaSeqColumnFields,
        actions: ["hidden"],
        condition: state => !state.rows.find(row => row.dataset_type === "RRS"),
    },
];
