import React from 'react';
import { makeStyles, Chip, Avatar } from '@material-ui/core';

const useStyles = makeStyles(theme => ({
    chip: {
        margin: theme.spacing(.5)
    },
}));

interface DatasetTypesProps {
    datasetTypes: {[key: string]: number},
}

export default function DatasetTypes({ datasetTypes }: DatasetTypesProps) {
    const classes = useStyles();

    const getChip = (type: string, number: number) => {
        return <Chip className={classes.chip} label={type} avatar={<Avatar>{number}</Avatar>} />
    } 

    return (
        <div>
            {Object.keys(datasetTypes).map(type => getChip(type, datasetTypes[type]))}
        </div>
    );
}
