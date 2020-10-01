import React, { useState, useEffect } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Chip, IconButton } from '@material-ui/core';
import MaterialTable, { MTableToolbar } from 'material-table';
import { Cancel } from '@material-ui/icons';
import Typography from '@material-ui/core/Typography';
import Avatar from '@material-ui/core/Avatar';
import Button from '@material-ui/core/Button';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import ArrowDropUpIcon from '@material-ui/icons/ArrowDropUp';
import { Participant, rows } from './MockData';

interface DatasetTypeProps{
    type: string,
    number: number,
}
const useStyles = makeStyles(theme => ({
    chip: {
        margin: theme.spacing(.5)
    },

}));
export default function DatasetType({ type, number }: DatasetTypeProps) {
    const classes = useStyles();
    if(number === 0){
        return (
            <Chip className={classes.chip} variant="default" color="default" size="small" label={type} />
        )
    }else{
        return (
            <Chip className={classes.chip} variant="default" color="default" label={type} avatar={<Avatar>{number}</Avatar>}/>
        )
    }

    
}