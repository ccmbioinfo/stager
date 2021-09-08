import { useState } from "react";
import { TableRow } from "@material-ui/core";
import { Delete, LibraryAdd } from "@material-ui/icons";
import { getKeys } from "../../functions";
import { useFamiliesQuery } from "../../hooks";
import {
    DataEntryColumnConfig,
    DataEntryField,
    DataEntryRow,
    DataEntryRowRNA,
    Family,
    UnlinkedFile,
} from "../../typings";
import { DataEntryActionCell, DataEntryCell } from "./TableCells";
import { participantColumns } from "./utils";

interface DataEntryTableRowProps {
    columns: DataEntryColumnConfig[];
    getOptions: (rowIndex: number, col: DataEntryColumnConfig, families: Family[]) => any[];
    onChange: (
        newValue: string | boolean | UnlinkedFile[],
        rowIndex: number,
        col: DataEntryColumnConfig,
        families: Family[],
        autopopulate?: boolean
    ) => void;
    onDelete: () => void;
    onDuplicate: () => void;
    row: DataEntryRow;
    rowIndex: number;
}

/**
 * Internal component for handling rows in the body of the DataEntryTable.
 */
export default function DataEntryTableRow({
    columns,
    getOptions: _getOptions,
    onChange,
    onDelete,
    onDuplicate,
    row,
    rowIndex,
}: DataEntryTableRowProps) {
    const [familySearch, setFamilySearch] = useState("");
    const familiesResult = useFamiliesQuery(familySearch);
    const families = familiesResult.data || [];

    function handleChange(
        newValue: string | boolean | UnlinkedFile[],
        col: DataEntryColumnConfig,
        autopopulate?: boolean
    ) {
        return onChange(newValue, rowIndex, col, families, autopopulate);
    }

    function onSearch(col: DataEntryColumnConfig, value: string) {
        if (col.field === "family_codename") {
            setFamilySearch(value);
        }
    }

    function getOptions(rowIndex: number, col: DataEntryColumnConfig) {
        return _getOptions(rowIndex, col, families);
    }

    const getColumnIsDisabled = (field: DataEntryField, row: DataEntryRow) =>
        (row.meta.participantColumnsDisabled && participantColumns.includes(field)) ||
        (getKeys(new DataEntryRowRNA()).includes(field as any) &&
            row.fields.dataset_type !== "RRS");

    return (
        <TableRow key={rowIndex}>
            <DataEntryActionCell tooltipTitle="Delete row" icon={<Delete />} onClick={onDelete} />
            <DataEntryActionCell
                tooltipTitle="Duplicate row"
                icon={<LibraryAdd />}
                onClick={onDuplicate}
            />
            {columns.map(
                col =>
                    !col.hidden && (
                        <DataEntryCell
                            col={col}
                            disabled={getColumnIsDisabled(col.field, row)}
                            getOptions={getOptions}
                            key={col.field}
                            loading={col.field === "family_codename" && familiesResult.isLoading}
                            onEdit={(newValue, autocomplete?: boolean) =>
                                handleChange(newValue, col, autocomplete)
                            }
                            onSearch={search => onSearch(col, search)}
                            required={!getColumnIsDisabled(col.field, row) && col.required}
                            row={row}
                            rowIndex={rowIndex}
                        />
                    )
            )}
        </TableRow>
    );
}
