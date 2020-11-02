import React from "react";
import Button, { ButtonProps } from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";

export interface ConfirmModalProps {
    id: string;
    title: React.ReactNode;
    children: React.ReactNode;
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    color: ButtonProps["color"];
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
                <Button onClick={props.onClose} color="primary">
                    No, go back
                </Button>
                <Button onClick={props.onConfirm} color={props.color} variant="contained" autoFocus>
                    Yes
                </Button>
            </DialogActions>
        </Dialog>
    );
}
