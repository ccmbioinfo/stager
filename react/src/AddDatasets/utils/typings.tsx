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
export type WholeColumnActionType = "hidden"[];
export type RowColumnActionType = ("disabled" | "required")[];
export type ColumnActionType = WholeColumnActionType | RowColumnActionType;

/**
 * A set of columns that can be required, disabled, or hidden.
 * If a condition is provided, then that condition must be met
 * for the action to occur. Otherwise, the action is always
 * active.
 */
interface ColumnRequirementBase {
    columns: (keyof DataEntryRow)[];
    actions: ColumnActionType;
}

/**
 * For column requirements whose actions can apply
 * to some cells within a column.
 */
export interface RowColumnRequirement extends ColumnRequirementBase {
    condition?: (state: DataEntryTableState) => boolean[];
    actions: RowColumnActionType;
}

/**
 * For column requirements whose actions only make sense
 * if they apply to an entire column.
 */
export interface WholeColumnRequirement extends ColumnRequirementBase {
    condition?: (state: DataEntryTableState) => boolean;
    actions: WholeColumnActionType;
}

export type ColumnRequirement = RowColumnRequirement | WholeColumnRequirement;

/**
 * Internal column state for DataEntryHeaders.
 *
 * Fields that support boolean arrays will be applied to cells
 * whose row indexes are true in the array.
 *
 * Fields that support a boolean will be applied to all cells
 * in that column.
 */
export interface DataEntryColumn extends DataEntryHeader {
    required?: boolean | boolean[];
    hidden?: boolean;
    disabled?: boolean | boolean[];
}
