import React, { useState } from "react";
import { Box, Chip, Grid, makeStyles, Paper } from "@material-ui/core";
import { GroupChip } from "../typings";
import { PersonAdd, PersonAddDisabled } from "@material-ui/icons";

const useStyles = makeStyles(theme => ({
    root: {
        margin: theme.spacing(1),
    },
}));

/**
 * A chip transfer list. Users can click on chips to
 * move them between the two lists.
 */
export default function ChipTransferList() {
    const classes = useStyles();
    const [items, setItems] = useState<GroupChip[]>(
        ["FOO", "BAR", "BAZ", "FAZ"].map((label, index) => ({
            label: label,
            key: index,
            selected: false,
        }))
    );

    function toggleSelected(chip: GroupChip) {
        setItems(
            items.map(item =>
                item.key === chip.key ? { ...item, selected: !item.selected } : item
            )
        );
    }

    return (
        <Grid container xs={12} spacing={1} className={classes.root}>
            <Grid item container xs={12} alignItems="center">
                <Grid item>
                    <PersonAdd fontSize="large" />
                </Grid>
                <Grid item>
                    <ChipArray
                        chips={items.filter(chip => !!chip.selected)}
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
                        chips={items.filter(chip => !chip.selected)}
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

function ChipArray(props: { chips: GroupChip[]; onClick: (chip: GroupChip) => void }) {
    const classes = useChipStyles();

    return (
        <>
            {props.chips.length > 0 && (
                <Paper className={classes.paper}>
                    <Box component="ul" className={classes.chipList}>
                        {props.chips.map(chip => {
                            return (
                                <li key={chip.key}>
                                    <Chip
                                        label={chip.label}
                                        className={classes.chip}
                                        onClick={() => props.onClick(chip)}
                                    />
                                </li>
                            );
                        })}
                    </Box>
                </Paper>
            )}
        </>
    );
}
