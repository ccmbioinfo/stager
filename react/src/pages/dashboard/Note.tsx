import React from 'react';
import { Typography } from '@material-ui/core';
import { Participant } from './MockData';

interface NoteProps {
    rowData: Participant,
}

export default function Note({ rowData }: NoteProps) {
    
    return (
        <Typography>
            {rowData.note}
        </Typography>
    )
}
