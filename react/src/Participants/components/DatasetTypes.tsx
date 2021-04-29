import React from "react";
import { Avatar, Chip, makeStyles } from "@material-ui/core";

const useStyles = makeStyles(theme => ({
    chip: {
        margin: theme.spacing(0.5),
    },
}));

interface DatasetTypesProps {
    datasetTypes: { [key: string]: number };
}

export default function DatasetTypes({ datasetTypes }: DatasetTypesProps) {
    const classes = useStyles();

    return (
        <div>
            {Object.keys(datasetTypes).map(type => {
                return (
                    <Chip
                        className={classes.chip}
                        key={type}
                        label={type}
                        size="small"
                        avatar={<Avatar>{datasetTypes[type]}</Avatar>}
                    />
                );
            })}
        </div>
    );
}
