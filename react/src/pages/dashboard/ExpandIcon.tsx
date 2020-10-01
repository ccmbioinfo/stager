import React, { useState, useEffect } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Chip, IconButton } from '@material-ui/core';
import MaterialTable, { MTableToolbar } from 'material-table';
import { Cancel, ToggleOff } from '@material-ui/icons';
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
    expand: boolean,
}

export default function ExpandIcon() {
    const classes = useStyles();
    const [icon, setIcon] = useState(<ArrowDropDownIcon />)
    const [isDown, setIsDown] = useState(true)

    const toggle = () => {
        if(isDown){
            setIcon(<ArrowDropUpIcon />)
            
        }else{
            setIcon(<ArrowDropDownIcon />)
        }
        console.log(icon)
        setIsDown(!isDown)
    }
    
    return (
        <div className={classes.noteContainer} onClick={toggle}>
            {icon}
        </div>
    )
}
