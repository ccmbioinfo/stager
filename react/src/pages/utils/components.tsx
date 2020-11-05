import React from "react";
import {
    DialogTitle,
    IconButton,
    makeStyles,
    Typography,
    TypographyProps,
} from "@material-ui/core";
import { Close } from "@material-ui/icons";

/**
 * Returns a simple Typography JSX element for displaying "title: value".
 */
export function FieldDisplay(
    props: TypographyProps & { title: string; value?: string[] | string | number | boolean | null }
) {
    let val = props.value;
    if (Array.isArray(props.value)) val = props.value.join(", ");
    else if (props.value === null || props.value === undefined) val = "";
    else if (typeof props.value === "boolean") val = props.value ? "Yes" : "No";

    return (
        <Typography variant={props.variant ? props.variant : "body1"} gutterBottom>
            <b>{props.title}:</b> {val}
        </Typography>
    );
}

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
export function DialogHeader(props: DialogTitleProps) {
    const { children, onClose, ...other } = props;
    const classes = useStyles();
    return (
        <DialogTitle disableTypography className={classes.root} {...other}>
            <Typography variant="h6">{children}</Typography>
            {onClose ? (
                <IconButton aria-label="close" className={classes.closeButton} onClick={onClose}>
                    <Close />
                </IconButton>
            ) : null}
        </DialogTitle>
    );
}
