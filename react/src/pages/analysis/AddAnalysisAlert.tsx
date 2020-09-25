import React, { useState } from 'react';
import { Button, ButtonGroup,  Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@material-ui/core';
import { useHistory } from 'react-router';

interface AddAnalysisAlertProps {
    open: boolean,
    onAccept: () => void,
    onClose: () => void
}

export default function AddAnalysisAlert(props: AddAnalysisAlertProps) {
    return (
        <Dialog
            open={props.open}
            onClose={props.onClose}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
        >
            <DialogTitle id="alert-dialog-title">{"Add new Analysis"}</DialogTitle>
            <DialogContent>
            <DialogContentText id="alert-dialog-description">
                New analyses are created in the Participants panel. Would you like to be moved to the Participants panel?
            </DialogContentText>
            </DialogContent>
            <DialogActions>
            <ButtonGroup>
                <Button onClick={props.onClose} color="default" variant="contained">
                    Decline
                </Button>
                <Button onClick={props.onAccept} color="primary" autoFocus variant="contained">
                    Accept
                </Button>
            </ButtonGroup>
            </DialogActions>
        </Dialog>
    );
}