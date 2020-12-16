import React from "react";
import {
    Button,
    ButtonProps,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
} from "@material-ui/core";

export interface ConfirmModalProps {
    id: string;
    title: React.ReactNode;
    children: React.ReactNode;
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    colors?: { confirm?: ButtonProps["color"]; cancel?: ButtonProps["color"] };
}

export default function ConfirmModal(props: ConfirmModalProps) {
    return (
        <Dialog
            open={props.open}
            onClose={props.onClose}
            aria-labelledby={`${props.id}-title`}
            aria-describedby={`${props.id}-description`}
        >
            <DialogTitle id={`${props.id}-title`}>{props.title}</DialogTitle>
            <DialogContent>
                <DialogContentText id={`${props.id}-description`}>
                    {props.children}
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button
                    onClick={props.onClose}
                    color={props.colors?.cancel || "default"}
                    variant="contained"
                >
                    No, go back
                </Button>
                <Button
                    onClick={props.onConfirm}
                    color={props.colors?.confirm || "primary"}
                    variant="contained"
                    autoFocus
                >
                    Yes
                </Button>
            </DialogActions>
        </Dialog>
    );
}
