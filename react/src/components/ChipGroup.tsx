import React from "react";
import { Box, BoxProps, Chip, ChipProps } from "@material-ui/core";

/**
 * Displays a group of chips from an array of names.
 */
export default function ChipGroup(props: { names: string[]; size?: ChipProps["size"] } & BoxProps) {
    const { names, ...boxProps } = props;
    return (
        <>
            {names.map(name => (
                <Box key={`chip-${name}`} {...boxProps}>
                    <Chip size={props.size} label={name} />
                </Box>
            ))}
        </>
    );
}
