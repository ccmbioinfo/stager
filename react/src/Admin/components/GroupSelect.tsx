import React from "react";
import { makeStyles, Typography } from "@material-ui/core";
import { ChipSelect } from "../../components";
import { Group } from "../../typings";

const useStyles = makeStyles(theme => ({
    groupSelect: {
        margin: theme.spacing(1, 0, 2),
    },
    title: {
        margin: theme.spacing(0, 0, 2),
    },
}));

/**
 * ChipSelect wrapper for groups. Displays capitalized group codes which are
 * nicer to read.
 */
export default function GroupSelect(props: {
    groups: Group[] | undefined;
    selected: string[];
    onSelectionChange: (selectedGroups: string[]) => void;
}) {
    const groups = props.groups || [];
    const classes = useStyles();
    const labels = groups.map(group => group.group_code.toUpperCase());
    const selected = props.selected.map(value => value.toUpperCase());

    function onChange(label: string, newValue: boolean) {
        if (newValue) {
            // Selected, so add new label
            props.onSelectionChange(props.selected.concat(label.toLowerCase()));
        } else {
            // Removed, so filter out
            props.onSelectionChange(props.selected.filter(value => value !== label.toLowerCase()));
        }
    }

    return (
        <div className={classes.groupSelect}>
            <Typography className={classes.title}>
                <b>Permission Groups</b>
            </Typography>
            <ChipSelect
                labels={labels}
                selected={selected}
                onClick={onChange}
                emptyHelperText="No groups selected."
            />
        </div>
    );
}
