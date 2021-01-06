import React from "react";
import { makeStyles, Popover, PopoverProps, Typography } from "@material-ui/core";

const useStyles = makeStyles(theme => ({
    typography: {
        margin: theme.spacing(2),
    },
}));

export default function LinkedFilesPopover(
    props: {
        fileNames: string[];
    } & PopoverProps
) {
    const classes = useStyles();
    const { fileNames, ...popoverProps } = props;

    return (
        <Popover {...popoverProps}>
            {props.fileNames.map(name => (
                <Typography className={classes.typography} key={`file-${name}`}>
                    {name}
                </Typography>
            ))}
        </Popover>
    );
}
