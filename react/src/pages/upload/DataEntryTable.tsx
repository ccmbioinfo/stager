import React, { useState } from 'react';
import { Table, TableBody, TableContainer, TableHead } from '@material-ui/core';
import { DataEntryRow } from '../utils';



export default function DataEntryTable(props: any) {
    const [rows, setRows] = useState<DataEntryRow[]>([]);

    return (
        <TableContainer>
            <Table>
                <TableHead>

                </TableHead>
                <TableBody>

                </TableBody>
            </Table>
        </TableContainer>
    );
}
