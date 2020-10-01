import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Chip } from '@material-ui/core';
import Avatar from '@material-ui/core/Avatar';

const useStyles = makeStyles(theme => ({
    chip: {
        margin: theme.spacing(.5)
    },
}));

interface DatasetTypeProps{
    type: string,
    number: number,
}

export default function DatasetType({ type, number }: DatasetTypeProps) {
    const classes = useStyles();
    return (
        <Chip className={classes.chip} label={type} avatar={<Avatar>{number}</Avatar>}/>
    )
}