import React, { ReactNode, useState } from 'react';
import { CircularProgress, IconButton, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField } from '@material-ui/core';
import { Autocomplete, createFilterOptions } from '@material-ui/lab';
import { DataEntryHeader, DataEntryRow, getProp } from '../utils';
import { AddBox, Delete } from '@material-ui/icons';

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

    const actions = [];

    return (
        <Paper>
        <TableContainer>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell padding="none"/>
                        <TableCell padding="none"/>
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
                        <DataEntryActionCell
                        icon={(<Delete/>)}
                        onClick={(e) => {
                            setRows(rows.filter((value, index) => index !== y));
                        }}
                        />
                        <DataEntryActionCell
                        icon={(<AddBox/>)}
                        onClick={(e) => {
                            setRows(rows.flatMap((value, index) => index === y ? [value, value] : value));
                        }}
                        />
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
    options?: string[],
    freeSolo?: boolean,
    onEdit: () => void
}

function DataEntryCell(props: DataEntryCellProps) {
    const [row, column] = [props.row, props.column];
    const [value, setValue] = useState(getProp(row, column.field)?.toString());
    const [options, setOptions] = useState<string[]>(props.options || []);

    return (
        <TableCell>
            <Autocomplete<string, undefined, undefined, boolean | undefined>
            freeSolo={props.freeSolo}
            selectOnFocus
            clearOnBlur
            handleHomeEndKeys
            onChange={(event, newValue, reason) => {
                // 'value' refers to what the user types
                // 'inputValue' refers to the selected option
                if (newValue) setValue(newValue);
                else setValue("");
            }}
            value={value}
            options={options}
            renderInput={(params) =>
                <TextField
                {...params}
                variant="standard"
                InputProps={{
                    ...params.InputProps,
                    endAdornment: undefined
                }}
                />
            }
            filterOptions={(options, params) => {
                const filtered = filter(options, params);

                if (params.inputValue !== '') {
                  filtered.push(`Add "${params.inputValue}"`);
                }

                return filtered;
              }}
            />
        </TableCell>
    );
}


function DataEntryActionCell(props: { onClick?: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void, icon: ReactNode }) {
    return (
        <TableCell padding="none">
            <IconButton onClick={props.onClick}>
                {props.icon}
            </IconButton>
        </TableCell>
    )
}
