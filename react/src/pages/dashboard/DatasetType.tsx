import React from 'react';
import { makeStyles, Chip, Avatar } from '@material-ui/core';

const useStyles = makeStyles(theme => ({
    chip: {
        margin: theme.spacing(.5)
    },
}));

interface DatasetTypeProps {
    type: string,
    number: number,
}

export default function DatasetType({ type, number }: DatasetTypeProps) {
    const classes = useStyles();
    return (
        <Chip className={classes.chip} label={type} avatar={<Avatar>{number}</Avatar>} />
    )
}