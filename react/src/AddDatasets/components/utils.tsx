import { DataEntryColumnConfig, DataEntryField, DataEntryRow, Family, Option, UnlinkedFile } from "../../typings";

export const booleanColumns: DataEntryField[] = ["affected", "solved", "vcf_available"];
export const dateColumns: DataEntryField[] = ["sequencing_date"];
export const participantColumns = ["participant_type", "sex", "affected", "solved"];
// Columns whose values are predefined
export const enumerableColumns: DataEntryField[] = [
    "linked_files",
    "condition",
    "dataset_type",
    "participant_type",
    "sex",
    "tissue_sample_type",
    "institution",
];

// Convert the provided value into an Option
export function toOption(
    str: string | boolean | number | undefined | Option | null,
    origin?: string,
    disabled?: boolean
): Option {
    if (str === null) {
        //typof null === 'object
        str = undefined;
    }
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
 * @param institutions The result from /api/institutions
 */
export function getOptions(
    rows: DataEntryRow[],
    col: DataEntryColumnConfig,
    rowIndex: number,
    families: Family[],
    enums: Record<string, string[]> | undefined,
    institutions: string[]
) {
    const row = rows[rowIndex];
    const rowOptions = rows
        .filter((_, index) => index !== rowIndex) // not this row
        .map(row =>
            toOption(
                //type discrimination, these fields manage their own options
                col.field === "linked_files" || col.field === "candidate_genes"
                    ? undefined
                    : row.fields[col.field],
                "Previous rows"
            )
        );

    const familyCodenames: string[] = families.map(value => value.family_codename);
    const booleans = ["true", "false"];

    switch (col.field) {
        case "family_codename":
            const familyOptions = families.map(value =>
                toOption(value.family_codename, "Existing families")
            );
            return familyOptions.concat(rowOptions);

        case "participant_codename":
            const thisFamily = row.fields.family_codename;
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

        // case "linked_files":
        //     return files;

        case "condition":
            if (enums) {
                return (enums.DatasetCondition as string[]).map(value =>
                    toOption(value, "Dataset Conditions")
                );
            }
            return rowOptions;

        case "institution":
            return institutions.map(i => toOption(i, "Institutions"));

        default:
            return rowOptions;
    }
}

/**
 * Convert an array of objects to a CSV string.
 *
 * Precondition: all objects in the array have the same keys.
 *
 * @param rows An array of DataEntryFields.
 * @param headers Array of column headers aka. keys of the provided rows to return.
 * @param onlyHeaders If true, only returns the header row.
 */
export function objArrayToCSV(
    rows: DataEntryRow[],
    headers: DataEntryField[],
    onlyHeaders: boolean = false
): string {
    if (rows.length === 0 || headers.length === 0) return "";

    let csv = headers.join(",") + "\n";

    if (onlyHeaders) return csv;

    for (const row of rows) {
        let values: string[] = [];
        for (const header of headers) {
            let value = row.fields[header];
            if (Array.isArray(value)) value = value.join("|");
            else if (!value) value = "";
            else if (typeof value !== "string") value = "" + value;
            value.replaceAll(/"/g, '""');
            values.push(`"${value}"`);
        }
        csv += values.join(",") + "\n";
    }

    return csv;
}
