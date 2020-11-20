import { DataEntryHeader, DataEntryRow } from "../utils/typings";
import { getDataEntryHeaders, snakeCaseToTitle } from "../utils/functions";

export const booleanColumns: Array<keyof DataEntryRow> = ["affected", "solved"];
export const dateColumns: Array<keyof DataEntryRow> = ["sequencing_date"];

// Columns whose values are predefined
export const enumerableColumns: Array<keyof DataEntryRow> = [
    "input_hpf_path",
    "condition",
    "dataset_type",
    "participant_type",
    "sex",
    "tissue_sample_type",
];

// Convert a field string (snake_case) into a displayable title (Snake Case)
function formatFieldToTitle(field: string): string {
    return snakeCaseToTitle(field) // convert to title case
        .replace(/([iI][dD])/g, txt => txt.toUpperCase()); // capitalize any occurrance of "ID"
}

// Given a DataEntryRow field, return a new DataEntryHeader obj
function toColumn(field: keyof DataEntryRow, hidden?: boolean, title?: string): DataEntryHeader {
    return {
        field: field,
        title: title ? title : formatFieldToTitle(field),
        hidden: hidden,
    };
}

// Return the specified category of DataEntryHeaders for use in the table
export function getColumns(category: "required" | "optional" | "RNASeq"): DataEntryHeader[] {
    return (getDataEntryHeaders()[category] as Array<keyof DataEntryRow>).map(field =>
        toColumn(field, category !== "required")
    );
}

export interface Option {
    title: string;
    inputValue: string;
    origin?: string;
    disabled?: boolean;
}

// Convert the provided value into an Option
export function toOption(
    str: string | boolean | number | undefined | Option,
    origin?: string,
    disabled?: boolean
): Option {
    let inputValue = str;
    switch (typeof str) {
        case "string":
            inputValue = str;
            break;
        case "number":
            inputValue = str.toString();
            break;
        case "boolean":
            inputValue = str ? "true" : "false";
            break;
        case "undefined":
            inputValue = "";
            break;
        default:
            return { ...str, origin: origin, disabled: disabled };
    }
    return { title: inputValue, inputValue: inputValue, origin: origin, disabled: disabled };
}

/**
 * Returns the allowed options for the selected cell.
 *
 * @param rows The data currently stored in the table.
 * @param col The column (header) for this cell.
 * @param rowIndex The row index of this cell.
 * @param families The result from /api/families
 * @param enums The result from /api/enums
 */
export function getOptions(
    rows: DataEntryRow[],
    col: DataEntryHeader,
    rowIndex: number,
    families: Array<any>,
    enums: any,
    files: string[]
): Option[] {
    const row = rows[rowIndex];
    const rowOptions = rows
        .filter((val, index) => index !== rowIndex) // not this row
        .map(val => toOption(val[col.field], "Previous rows"));

    const familyCodenames: string[] = families.map(value => value.family_codename);
    const booleans = ["true", "false"];

    switch (col.field) {
        case "family_codename":
            const familyOptions = families.map(value =>
                toOption(value.family_codename, "Existing families")
            );
            return familyOptions.concat(rowOptions);

        case "participant_codename":
            const thisFamily = row.family_codename;
            if (familyCodenames.findIndex(family => family === thisFamily) !== -1) {
                const existingParts = families
                    .filter(family => family.family_codename === thisFamily)
                    .flatMap(family => family.participants)
                    .map(value => toOption(value.participant_codename, "Participants in family"));
                const otherParts = families
                    .filter(family => family.family_codename !== thisFamily)
                    .flatMap(family => family.participants)
                    .map(value => toOption(value.participant_codename, "Other participants"));
                return existingParts.concat(otherParts).concat(rowOptions);
            } else {
                const participants = families.flatMap(family => family.participants);
                const participantOptions = participants.map(value =>
                    toOption(value.participant_codename, "Existing participants")
                );
                return participantOptions.concat(rowOptions);
            }

        case "participant_type":
            if (enums) {
                const participantTypeOptions = (enums.ParticipantType as string[]).map(value =>
                    toOption(value, "Participant Types")
                );
                return participantTypeOptions;
            }
            return rowOptions;

        case "tissue_sample_type":
            if (enums) {
                const tissueTypeOptions = (enums.TissueSampleType as string[]).map(value =>
                    toOption(value, "Tissue Types")
                );
                return tissueTypeOptions;
            }
            return rowOptions;

        case "dataset_type":
            if (enums) {
                return (enums.DatasetType as string[]).map(value =>
                    toOption(value, "Dataset Types")
                );
            }
            return rowOptions;

        case "sex":
            if (enums) {
                const sexOptions = (enums.Sex as string[]).map(value => toOption(value, "Sexes"));
                return sexOptions;
            }
            return rowOptions;

        case "affected":
            return booleans.map(b => toOption(b, "Is Affected"));

        case "solved":
            return booleans.map(b => toOption(b, "Is Solved"));

        case "input_hpf_path":
            return files.map(f => toOption(f, "Unlinked files"));

        case "condition":
            if (enums) {
                return (enums.DatasetCondition as string[]).map(value =>
                    toOption(value, "Dataset Conditions")
                );
            }
            return rowOptions;

        default:
            return rowOptions;
    }
}
