import React from 'react';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import Slide from '@material-ui/core/Slide';
import { TransitionProps } from '@material-ui/core/transitions';

interface CancelAnalysisDialogProp {
    title: string,
    message: string,
    open: boolean,
    labeledByPrefix: string,
    describedByPrefix: string,
    onClose: (() => void)
}

const Transition = React.forwardRef(function Transition(
    props: TransitionProps & { children?: React.ReactElement<any, any> },
    ref: React.Ref<unknown>,
) {
    return <Slide direction="up" ref={ref} {...props} />;
});

export default function CancelAnalysisDialog({ title, message, open, labeledByPrefix, describedByPrefix, onClose }: CancelAnalysisDialogProp) {

    const labeledBy = `${labeledByPrefix}-cancel-alert-dialog-title`
    const describedBy = `${describedByPrefix}-cancel-alert-dialog-description`

    return (
        <div>
            <Dialog
                open={open}
                TransitionComponent={Transition}
                keepMounted
                onClose={onClose}
                aria-labelledby={labeledBy}
                aria-describedby={describedBy}
            >
                <DialogTitle id={labeledBy}>{title}</DialogTitle>
                <DialogContent>
                    <DialogContentText id={describedBy}>
                        {message}
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose} color="primary">
                        Cancel
          </Button>
                    <Button onClick={onClose} color="primary">
                        Stop Analysis
          </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
}