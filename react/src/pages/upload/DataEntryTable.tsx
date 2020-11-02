import React, { useState } from 'react';
import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@material-ui/core';
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
                            <TableCell>
                                {getProp(row, col.field)}
                            </TableCell>
                        ))}
                    </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
        </Paper>
    );
}
