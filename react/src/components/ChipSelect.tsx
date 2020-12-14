import React, { useEffect, useState } from "react";
import { Chip, IconButton, makeStyles, Menu, MenuItem, Paper } from "@material-ui/core";
import { AddCircle } from "@material-ui/icons";

const useStyles = makeStyles(theme => ({
    root: {
        display: "flex",
        justifyContent: "center",
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
}));

interface SelectableChip {
    label: string;
    key: string;
    selected?: boolean;
}

export default function ChipSelect(props: {
    labels: string[];
    selected: string[];
    onSelectionChange?: (selectedLabels: string[]) => void;
}) {
    const classes = useStyles();
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const [chips, setChips] = useState<SelectableChip[]>(
        props.labels.sort().map(label => ({ label: label, key: label, selected: false }))
    );
    const [disableAdd, setDisableAdd] = useState(false);

    useEffect(() => {
        setChips(chips =>
            chips.map(chip => ({
                ...chip,
                selected: !!props.selected.find(label => label === chip.label),
            }))
        );
        setDisableAdd(props.selected.length === 0);
    }, [props.selected]);

    function handleClick(clickedChip: SelectableChip) {
        const newChips = chips.map(chip =>
            chip.key === clickedChip.key ? { ...chip, selected: !chip.selected } : chip
        );
        setChips(newChips);
        setDisableAdd(newChips.filter(chip => !chip.selected).length === 0);
    }

    return (
        <>
            <Paper className={classes.root}>
                <ul className={classes.chipList}>
                    {chips
                        .filter(chip => !!chip.selected)
                        .map(chip => (
                            <li key={chip.key}>
                                <Chip
                                    label={chip.label}
                                    onDelete={() => handleClick(chip)}
                                    className={classes.chip}
                                />
                            </li>
                        ))}
                </ul>
                <div className={classes.grow} />
                <IconButton
                    onClick={e => {
                        if (chips.filter(chip => !chip.selected).length > 0)
                            setAnchorEl(e.currentTarget);
                    }}
                    disabled={disableAdd}
                >
                    <AddCircle />
                </IconButton>
            </Paper>
            <Menu anchorEl={anchorEl} open={!!anchorEl} onClose={() => setAnchorEl(null)}>
                {chips
                    .filter(chip => !chip.selected)
                    .map(chip => (
                        <MenuItem
                            key={chip.key}
                            onClick={() => {
                                setAnchorEl(null);
                                handleClick(chip);
                            }}
                        >
                            {chip.label}
                        </MenuItem>
                    ))}
            </Menu>
        </>
    );
}
