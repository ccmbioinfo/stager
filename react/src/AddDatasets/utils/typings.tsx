/**
 * Types used in data entry table.
 */

import { DataEntryHeader, DataEntryRow } from "../../typings";

/**
 * The state of table data that the user has entered.
 */
export interface DataEntryTableState {
    rows: DataEntryRow[];
    groups: string[];
    columns: DataEntryColumn[];
}

/**
 * The initial properties for the data entry table.
 */
export interface DataEntryTableParameters {
    columns: DataEntryHeader[];
    initialRows: DataEntryRow[];
    columnRequirements: ColumnRequirement[];
    permissionGroups: string[]; // Group.group_code
}

// Matches the fields in DataEntryColumn
export type ColumnActionType = "required" | "disabled" | "hidden";

/**
 * A set of columns that can be required, disabled, or hidden.
 * If a condition is provided, then that condition must be met
 * for the action to occur. Otherwise, the action is always
 * active.
 */
export interface ColumnRequirement {
    columns: (keyof DataEntryRow)[];
    condition?: (state: DataEntryTableState) => boolean;
    action: ColumnActionType;
}

/**
 * Internal column state for DataEntryHeaders
 */
export interface DataEntryColumn extends DataEntryHeader {
    required?: boolean;
    hidden?: boolean;
    disabled?: boolean;
}
