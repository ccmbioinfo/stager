import { Popover, PopoverProps, Typography } from "@material-ui/core";
import React from "react";

export default function LinkedFilesPopover(
    props: {
        fileNames: string[];
    } & PopoverProps
) {
    const { fileNames, ...popoverProps } = props;

    return (
        <Popover {...popoverProps}>
            {props.fileNames.map(name => (
                <Typography>{name}</Typography>
            ))}
        </Popover>
    );
}
