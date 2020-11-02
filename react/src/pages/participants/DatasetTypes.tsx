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

    return (
        <div>
            {Object.keys(datasetTypes).map(type => {
                return <Chip className={classes.chip} label={type} size="small" avatar={<Avatar>{datasetTypes[type]}</Avatar>} />
            })}
        </div>
    );
}
