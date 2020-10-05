import React from 'react';
import { Button, ButtonGroup,  Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@material-ui/core';

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
            <DialogTitle id="alert-dialog-title">Request Analysis</DialogTitle>
            <DialogContent>
            <DialogContentText id="alert-dialog-description">
                Analyses are requested from the Datasets page. Would you like to go there now?
            </DialogContentText>
            </DialogContent>
            <DialogActions>
            <ButtonGroup>
                <Button onClick={props.onClose} color="default" variant="contained">
                    No
                </Button>
                <Button onClick={props.onAccept} color="primary" autoFocus variant="contained">
                    Yes
                </Button>
            </ButtonGroup>
            </DialogActions>
        </Dialog>
    );
}
