import React from "react";
import {
    DialogTitle,
    IconButton,
    makeStyles,
    Typography,
} from "@material-ui/core";
import { Close } from "@material-ui/icons";

interface DialogTitleProps {
    id: string;
    children: React.ReactNode;
    onClose: () => void;
}
const useStyles = makeStyles(theme => ({
    root: {
        margin: 0,
        padding: theme.spacing(2),
    },
    closeButton: {
        position: "absolute",
        right: theme.spacing(1),
        top: theme.spacing(1),
        color: theme.palette.grey[500],
    },
}));
/**
 * DialogTitle component for a standard dialog header.
 */
export function DialogHeader(props: DialogTitleProps) {
    const { children, onClose, ...other } = props;
    const classes = useStyles();
    return (
        <DialogTitle disableTypography className={classes.root} {...other}>
            <Typography variant="h6">{children}</Typography>
            {onClose && (
                <IconButton aria-label="close" className={classes.closeButton} onClick={onClose}>
                    <Close />
                </IconButton>
            ) }
        </DialogTitle>
    );
}
