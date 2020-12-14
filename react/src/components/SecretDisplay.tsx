import React, { useState } from "react";
import { Box, IconButton, Tooltip, Typography } from "@material-ui/core";
import { FileCopy, Visibility, VisibilityOff } from "@material-ui/icons";
import { Skeleton } from "@material-ui/lab";
import { useSnackbar } from "notistack";

/**
 * A UI element for displaying a secret. Provides a show/hide button and
 * a copy-to-clipboard button.
 */
export default function SecretDisplay(props: { title: string; secret: string }) {
    const [open, isOpen] = useState(false);
    const { enqueueSnackbar } = useSnackbar();

    return (
        <Box>
            <Typography>
                <b>{props.title}</b>
                <Tooltip title={`${open ? "Hide" : "Show"} key`}>
                    <IconButton onClick={() => isOpen(!open)}>
                        {open ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                </Tooltip>
                <Tooltip title="Copy to clipboard">
                    <IconButton
                        onClick={() => {
                            navigator.clipboard.writeText(props.secret).then(() => {
                                enqueueSnackbar(`${props.title} copied to clipboard.`);
                            });
                        }}
                    >
                        <FileCopy />
                    </IconButton>
                </Tooltip>
            </Typography>
            {open ? (
                <Typography>{props.secret}</Typography>
            ) : (
                <Skeleton animation={false} variant="text">
                    <Typography>{props.secret}</Typography>
                </Skeleton>
            )}
        </Box>
    );
}
