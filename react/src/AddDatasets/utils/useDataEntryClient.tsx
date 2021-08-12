import { useEffect, useMemo, useReducer } from "react";
import { createEmptyRows } from "../../functions";
import { DataEntryRow } from "../../typings";
import {
    ColumnRequirement,
    DataEntryColumn,
    DataEntryTableParameters,
    DataEntryTableState,
} from "./typings";

type DataEntryValue = DataEntryRow[keyof DataEntryRow];

export interface DataEntryClient {
    rows: DataEntryRow[];
    groups: string[];
    columns: DataEntryColumn[];
    handleDelete: (index: number) => void;
    handleDuplicate: (index: number) => void;
    handleEdit: (value: DataEntryValue, field: keyof DataEntryRow, rowIndex: number) => void;
}

// Duplicate a given row, if it exists
interface DuplicateAction {
    type: "duplicate";
    index: number;
}

// Delete a given row, if it exists
interface DeleteAction {
    type: "delete";
    index: number;
}

// Add a new empty row
interface AddEmptyAction {
    type: "add-empty";
}

// Edit a given column field at a given row
interface EditAction {
    type: "edit";
    index: number; // row index
    field: keyof DataEntryRow; // column field
    value: DataEntryValue;
}

// Update permission groups to new array of groups
interface ChangeGroupAction {
    type: "groups";
    groups: string[];
}

interface ColumnRequirementAction {
    type: "requirement";
    requirements: ColumnRequirement[];
}

type DataEntryStateAction =
    | DuplicateAction
    | DeleteAction
    | AddEmptyAction
    | EditAction
    | ChangeGroupAction
    | ColumnRequirementAction;

function reducer(state: DataEntryTableState, action: DataEntryStateAction) {
    switch (action.type) {
        case "duplicate":
            // Duplicate a given row
            if (action.index < 0 || action.index >= state.rows.length) {
                console.error(`Invalid row index to duplicate: ${action.index}`);
                return state;
            }
            return {
                ...state,
                rows: state.rows.flatMap((row, index) => {
                    if (action.index === index) return [row, { ...row, linked_files: undefined }];
                    return row;
                }),
            };
        case "delete":
            // Delete a given row
            if (action.index < 0 || action.index >= state.rows.length) {
                console.error(`Invalid row index to delete: ${action.index}`);
                return state;
            }
            return {
                ...state,
                rows: state.rows.filter((_, index) => index !== action.index),
            };
        case "add-empty":
            // Add a new empty row to the end of the row array
            return { ...state, rows: state.rows.concat(createEmptyRows(1)) };
        case "edit":
            // Edit a given field for a given row
            if (action.index < 0 || action.index >= state.rows.length) {
                console.error(`Invalid row index to edit: ${action.index}`);
                return state;
            }
            const newRows = state.rows;
            // @ts-ignore
            newRows[action.index][action.field] = action.value;
            return { ...state, rows: newRows };
        case "groups":
            // Update the groups
            return { ...state, groups: action.groups };
        case "requirement":
            // Update the columns based on requirements
            let newColumns = state.columns;
            for (let requirement of action.requirements) {
                const newColumnStatus =
                    requirement.condition === undefined || requirement.condition(state);
                const affectedColumns = new Map(requirement.columns.map(col => [col, true]));
                newColumns = newColumns.map(column => {
                    if (affectedColumns.get(column.field)) {
                        column[requirement.action] = newColumnStatus;
                    }
                    return column;
                });
            }
            return { ...state, columns: newColumns };
        default:
            // TODO: throw error or console.error?
            throw Error(`Invalid DataEntryStateAction: ${action}`);
    }
}

/**
 * Returns a client object that exposes functions
 * and values for managing the DataEntryTable.
 */
export function useDataEntryClient(params: DataEntryTableParameters): DataEntryClient {
    const [state, dispatch] = useReducer(reducer, {
        rows: params.initialRows,
        groups: params.permissionGroups.length === 1 ? params.permissionGroups : [],
        columns: params.columns,
    });

    // Handle column requirements when row data changes
    useEffect(() => {
        dispatch({ type: "requirement", requirements: params.columnRequirements });
    }, [state.rows, state.groups, params.columnRequirements]);

    // prevent re-renders by using same memoized object
    const client = useMemo<DataEntryClient>(
        () => ({
            ...state,
            handleDuplicate: (index: number) =>
                dispatch({
                    type: "duplicate",
                    index: index,
                }),
            handleDelete: (index: number) =>
                dispatch({
                    type: "delete",
                    index: index,
                }),
            handleEdit: (value: DataEntryValue, field: keyof DataEntryRow, rowIndex: number) =>
                dispatch({ type: "edit", value, field, index: rowIndex }),
        }),
        [state, dispatch]
    );

    return client;
}
