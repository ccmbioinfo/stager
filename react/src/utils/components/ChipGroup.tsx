import React from "react";
import { Box, BoxProps, Chip, ChipProps, makeStyles } from "@material-ui/core";

const useStyles = makeStyles(theme => ({
    chip: {
        marginLeft: theme.spacing(1),
    },
}));

/**
 * Displays a group of chips from an array of names.
 */
export default function ChipGroup(props: { names: string[]; size?: ChipProps["size"] } & BoxProps) {
    const classes = useStyles();
    const { names, ...boxProps } = props;
    return (
        <Box {...boxProps}>
            {props.names.map(name => (
                <Chip
                    key={`chip-${name}`}
                    size={props.size}
                    label={name}
                    className={classes.chip}
                />
            ))}
        </Box>
    );
}
