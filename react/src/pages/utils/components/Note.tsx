import React from "react";
import { makeStyles } from "@material-ui/core";

const useStyles = makeStyles(theme => ({
    notes: {
        // TODO: Find a better way to set maxWidth using container width
        maxWidth: "16em",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
        "&:hover": {
            whiteSpace: "normal",
            textOverflow: "default",
        },
    },
}));

/**
 * A style wrapper for strings of text that are really long.
 */
export default function Note(props: { children: React.ReactNode }) {
    const classes = useStyles();

    return <div className={classes.notes}>{props.children}</div>;
}
