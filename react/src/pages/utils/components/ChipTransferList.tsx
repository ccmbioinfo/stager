import React, { useEffect, useState } from "react";
import { Box, Chip, Grid, makeStyles, Paper } from "@material-ui/core";
import { PersonAdd, PersonAddDisabled } from "@material-ui/icons";

const useStyles = makeStyles(theme => ({
    root: {
        margin: theme.spacing(1),
    },
}));

interface TransferChip {
    label: string;
    key: number;
    selected: boolean;
}

/**
 * A chip transfer list. Users can click on chips to
 * move them between the two lists.
 */
export default function ChipTransferList(props: {
    labels: string[];
    defaultSelected?: string[];
    onSelectionChange: (selectedLabels: string[]) => void;
}) {
    const classes = useStyles();
    const [chips, setChips] = useState<TransferChip[]>([]);

    // Set state as side effect incase defaultSelected changes
    useEffect(() => {
        setChips(
            props.labels.map((label, index) => ({
                label: label,
                key: index,
                selected:
                    props.defaultSelected !== undefined &&
                    !!props.defaultSelected.find(val => val === label),
            }))
        );
    }, [props.labels, props.defaultSelected]);

    function toggleSelected(chip: TransferChip) {
        const newChips = chips.map(item =>
            item.key === chip.key ? { ...item, selected: !item.selected } : item
        );
        setChips(newChips);
        props.onSelectionChange(newChips.filter(chip => chip.selected).map(chip => chip.label));
    }

    return (
        <Grid container spacing={1} className={classes.root}>
            <Grid item container xs={12} alignItems="center">
                <Grid item>
                    <PersonAdd fontSize="large" />
                </Grid>
                <Grid item>
                    <ChipArray
                        chips={chips.filter(chip => !!chip.selected)}
                        onClick={toggleSelected}
                    />
                </Grid>
            </Grid>
            <Grid item container xs={12} alignItems="center">
                <Grid item>
                    <PersonAddDisabled fontSize="large" />
                </Grid>
                <Grid item>
                    <ChipArray
                        chips={chips.filter(chip => !chip.selected)}
                        onClick={toggleSelected}
                    />
                </Grid>
            </Grid>
        </Grid>
    );
}

const useChipStyles = makeStyles(theme => ({
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
    paper: {
        margin: theme.spacing(1),
    },
}));

function ChipArray(props: { chips: TransferChip[]; onClick: (chip: TransferChip) => void }) {
    const classes = useChipStyles();

    return (
        <>
            {props.chips.length > 0 && (
                <Paper className={classes.paper}>
                    <Box component="ul" className={classes.chipList}>
                        {props.chips.map(chip => (
                            <li key={chip.key}>
                                <Chip
                                    label={chip.label}
                                    className={classes.chip}
                                    onClick={() => props.onClick(chip)}
                                />
                            </li>
                        ))}
                    </Box>
                </Paper>
            )}
        </>
    );
}
