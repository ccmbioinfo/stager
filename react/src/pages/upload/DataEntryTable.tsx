import React, { useState } from 'react';
import { CircularProgress, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField } from '@material-ui/core';
import { Autocomplete, createFilterOptions } from '@material-ui/lab';
import { DataEntryHeader, DataEntryRow, getProp } from '../utils';

const defaultColumns: DataEntryHeader[] = [
    { title: "Family", field: "family_codename" },
    { title: "Participant", field: "participant_codename" },
    { title: "Participant Type", field: "participant_type" },
    { title: "Tissue Type", field: "tissue_sample_type" },
    { title: "Dataset Type", field: "dataset_type" }
];

export interface DataEntryTableProps {
    data?: DataEntryRow[],
}

function createEmptyRows(amount?: number): DataEntryRow[] {
    if (!amount || amount < 1) amount = 1;

    var arr = [];
    for (let i = 0; i < amount; i++) {
        arr.push({
            family_codename: "",
            participant_codename: "",
            participant_type: "",
            tissue_sample_type: "",
            dataset_type: ""
            });
    }
    return arr;
}

export default function DataEntryTable(props: DataEntryTableProps) {
    const [columns, setColumns] = useState<DataEntryHeader[]>(defaultColumns);
    const [rows, setRows] = useState<DataEntryRow[]>(props.data ? props.data : createEmptyRows(3));


    return (
        <Paper>
        <TableContainer>
            <Table>
                <TableHead>
                    <TableRow>
                        {columns.map((cell, index) => (
                            <TableCell>
                                {cell.title}
                            </TableCell>
                        ))}
                    </TableRow>
                </TableHead>
                <TableBody>
                    {rows.map((row, y) => (
                    <TableRow>
                        {columns.map((col, x) => (
                            <DataEntryCell
                            row={row}
                            column={col}
                            />
                        ))}
                    </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
        </Paper>
    );
}

const filter = createFilterOptions<string>({
    limit: 50
});

const exampleOptions = ["A001", "A002", "A003", "A004", "B001", "B002", "C001", "C002", "C003"];

interface DataEntryCellProps {
    row: DataEntryRow,
    column: DataEntryHeader,
    freeSolo?: boolean
}

function DataEntryCell(props: DataEntryCellProps) {
    const [row, column] = [props.row, props.column];
    const [value, setValue] = useState(getProp(row, column.field)?.toString());

    return (
        <TableCell>
            <Autocomplete<string, undefined, undefined, boolean | undefined>
            freeSolo={props.freeSolo}
            selectOnFocus
            clearOnBlur
            handleHomeEndKeys
            onChange={(event, newValue, reason) => {
                if (newValue) setValue(newValue);
                else setValue("");
            }}
            value={value}
            options={exampleOptions}
            renderInput={(params) =>
                <TextField
                {...params}
                variant="standard"
                InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                        <>
                            {/* {loading ? <CircularProgress color="inherit" size={20} /> : null} */}
                            {params.InputProps.endAdornment}
                        </>
                    )
                }}
                />
            }
            />
        </TableCell>
    );
}
