import React, { useState } from "react";
import { Chip, IconButton, makeStyles, Menu, MenuItem, Paper } from "@material-ui/core";
import { AddCircle } from "@material-ui/icons";

const useStyles = makeStyles(theme => ({
    root: {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
    },
    grow: {
        flexGrow: 1,
    },
    chipList: {
        display: "flex",
        justifyContent: "center",
        flexWrap: "wrap",
        listStyle: "none",
        padding: theme.spacing(0.5),
        margin: 0,
    },
    chip: {
        margin: theme.spacing(0.5),
    },
    emptyHelperText: {
        color: theme.palette.text.disabled,
        padding: theme.spacing(0, 2),
    },
}));

/**
 * A controlled component for selecting unique names from a list.
 */
export default function ChipSelect(props: {
    labels: string[];
    selected: string[];
    onClick: (label: string, newSelectState: boolean) => void;
    emptyHelperText?: string;
}) {
    const classes = useStyles();
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const disableAdd = props.labels.length === props.selected.length;

    const chips = new Map(props.labels.map(label => [label, props.selected.includes(label)]));

    function handleClick(label: string) {
        props.onClick(label, !chips.get(label));
    }

    return (
        <>
            <Paper className={classes.root}>
                {props.selected.length === 0 && (
                    <div className={classes.emptyHelperText}>
                        {props.emptyHelperText || "None selected."}
                    </div>
                )}
                <ul className={classes.chipList}>
                    {props.selected.map(label => (
                        <li key={`chip-${label}`}>
                            <Chip
                                label={label}
                                onDelete={() => handleClick(label)}
                                className={classes.chip}
                            />
                        </li>
                    ))}
                </ul>
                <div className={classes.grow} />
                <IconButton
                    onClick={e => {
                        setAnchorEl(e.currentTarget);
                    }}
                    disabled={disableAdd}
                >
                    <AddCircle />
                </IconButton>
            </Paper>
            <Menu anchorEl={anchorEl} open={!!anchorEl} onClose={() => setAnchorEl(null)}>
                {props.labels
                    .filter(label => !chips.get(label))
                    .map(label => (
                        <MenuItem
                            key={`menu-${label}`}
                            onClick={() => {
                                setAnchorEl(null);
                                handleClick(label);
                            }}
                        >
                            {label}
                        </MenuItem>
                    ))}
            </Menu>
        </>
    );
}
