import React, { useState } from "react";
import { TableRow } from "@material-ui/core";
import { Delete, LibraryAdd } from "@material-ui/icons";
import { useFamiliesQuery } from "../../hooks";
import { DataEntryHeader, DataEntryRow, Family, UnlinkedFile } from "../../typings";
import { participantColumns, useDataEntryContext } from "../utils";
import { DataEntryActionCell, DataEntryCell, DataEntryCellProps } from "./TableCells";

export interface DataEntryTableRowProps {
    row: DataEntryRow;
    columns: DataEntryHeader[];
    onDelete: () => void;
    onDuplicate: () => void;
    bindTableRow: (column: DataEntryHeader[]) => DataEntryCellProps;
    // onChange: (
    //     newValue: string | boolean | UnlinkedFile[],
    //     rowIndex: number,
    //     col: DataEntryHeader,
    //     families: Family[],
    //     autopopulate?: boolean
    // ) => void;
    // getOptions: (rowIndex: number, col: DataEntryHeader, families: Family[]) => any[];
}

/**
 * Internal component for handling rows in the body of the DataEntryTable.
 */
export default function DataEntryTableRow(props: DataEntryTableRowProps) {
    const [familySearch, setFamilySearch] = useState("");
    const familiesResult = useFamiliesQuery(familySearch);
    const families = familiesResult.data || [];
    const dataEntryClient = useDataEntryContext();

    function onSearch(col: DataEntryHeader, value: string) {
        if (col.field === "family_codename") {
            setFamilySearch(value);
        }
    }

    return (
        <TableRow>
            <DataEntryActionCell
                tooltipTitle="Delete row"
                icon={<Delete />}
                onClick={props.onDelete}
            />
            <DataEntryActionCell
                tooltipTitle="Duplicate row"
                icon={<LibraryAdd />}
                onClick={props.onDuplicate}
            />

            {props.requiredCols.map(col => (
                <DataEntryCell
                    row={props.row}
                    rowIndex={props.rowIndex}
                    col={col}
                    getOptions={getOptions}
                    onEdit={(newValue, autocomplete?: boolean) =>
                        handleChange(newValue, col, autocomplete)
                    }
                    key={col.field}
                    required={!props.row.participantColDisabled} // not required if pre-filled
                    disabled={
                        props.row.participantColDisabled &&
                        (participantColumns as string[]).includes(col.field)
                    }
                    onSearch={search => onSearch(col, search)}
                    loading={col.field === "family_codename" && familiesResult.isLoading}
                />
            ))}
            {props.optionalCols.map(
                col =>
                    !col.hidden && (
                        <DataEntryCell
                            row={props.row}
                            rowIndex={props.rowIndex}
                            col={col}
                            getOptions={getOptions}
                            onEdit={newValue => handleChange(newValue, col)}
                            key={col.field}
                            disabled={
                                props.row.participantColDisabled &&
                                !!participantColumns.find(currCol => currCol === col.field)
                            }
                        />
                    )
            )}

            {showRNA &&
                props.rnaSeqCols.map(col => (
                    <DataEntryCell
                        row={props.row}
                        rowIndex={props.rowIndex}
                        col={col}
                        getOptions={getOptions}
                        onEdit={newValue => handleChange(newValue, col)}
                        key={col.field}
                    />
                ))}
        </TableRow>
    );
}
