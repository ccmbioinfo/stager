import React, { useState, useEffect } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Chip, IconButton } from '@material-ui/core';
import MaterialTable, { MTableToolbar } from 'material-table';
import { Cancel } from '@material-ui/icons';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import ArrowDropUpIcon from '@material-ui/icons/ArrowDropUp';
import { Participant } from './MockData';

const useStyles = makeStyles(theme => ({
    noteContainer: {
        // display: 'flex',

    },
    note: {
        display: 'block'
    }

}));

interface NoteProps{
    rowData: Participant,
    openedRows: string[],
}

export default function Note({ rowData, openedRows }: NoteProps) {
    
    const classes = useStyles();
    
    
    // useEffect(() => {
    //     if(expand){
    //         setNote(rowData.note)
    //     }
        
    // }, []);
    let noteToDisplay= rowData.note;
    // if(openedRows.includes(rowData.participantID)){
    //     noteToDisplay 
    // }else{
    //     noteToDisplay = rowData.note.substring(0, 21)
    //     if(rowData.note.length > 20){ noteToDisplay += "..."; }
    // }
    
    return (
        <div className={classes.noteContainer}>
            <Typography className={classes.note}>
                {noteToDisplay}
            </Typography>
        </div>
    )
}
