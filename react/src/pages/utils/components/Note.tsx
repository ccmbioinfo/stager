import React, { useState } from "react";
import { makeStyles, Popover, Typography } from "@material-ui/core";

const useStyles = makeStyles(theme => ({
    notes: {
        minWidth: "inherit",
        maxWidth: "16em",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
        cursor: "pointer",
        textDecoration: "underline dashed",
        textDecorationColor: theme.palette.text.hint,
    },
    typography: {
        padding: theme.spacing(1),
    },
    paper: {
        maxWidth: theme.breakpoints.values.sm,
    },
}));

/**
 * A style wrapper for strings of text that are really long.
 */
export default function Note(props: { children: React.ReactNode }) {
    const classes = useStyles();
    const [anchorEl, setAnchorEl] = useState<HTMLDivElement | null>(null);

    return (
        <>
            <div className={classes.notes} onClick={event => setAnchorEl(event.currentTarget)}>
                {props.children}
            </div>
            <Popover
                open={!!anchorEl}
                anchorEl={anchorEl}
                onClose={() => setAnchorEl(null)}
                PaperProps={{ className: classes.paper }}
            >
                <Typography className={classes.typography}>{props.children}</Typography>
            </Popover>
        </>
    );
}
