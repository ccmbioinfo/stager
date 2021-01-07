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
    // sort alphabetically, case-insensitive
    const sortedNames = fileNames.sort((a, b) => {
        const [a_lower, b_lower] = [a.toLowerCase(), b.toLowerCase()];
        if (a_lower < b_lower) return -1;
        if (a_lower > b_lower) return 1;
        return 0;
    });

    return (
        <Popover {...popoverProps}>
            {sortedNames.map(name => (
                <Typography className={classes.typography} key={name}>
                    {name}
                </Typography>
            ))}
        </Popover>
    );
}
