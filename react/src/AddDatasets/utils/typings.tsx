/**
 * Types used in data entry table.
 */

import { DataEntryRow } from "../../typings";

/**
 * The state of table data that the user has entered.
 */
export interface DataEntryTableState {
    rows: DataEntryRow[];
    groups: string[];
}

/**
 * The initial properties for the data entry table.
 */
export interface DataEntryTableProperties {
    columnRequirements: ColumnRequirement[];
    permissionGroups: string[]; // group_code
}

/**
 * A set of required columns. If a condition is provided, then
 * the columns are only required if the condition is met.
 */
export interface ColumnRequirement {
    columns: Array<keyof DataEntryRow>;
    condition?: (row: DataEntryRow) => boolean;
}
