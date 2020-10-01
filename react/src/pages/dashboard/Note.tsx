import React, { useState, useEffect } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import { Participant } from './MockData';

const useStyles = makeStyles(theme => ({
}));

interface NoteProps{
    rowData: Participant,
}

export default function Note({ rowData }: NoteProps) {
    
    return (
        <div>
            <Typography>
                {rowData.note}
            </Typography>
        </div>
    )
}
