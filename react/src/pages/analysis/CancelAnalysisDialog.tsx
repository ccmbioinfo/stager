import React from 'react';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import Slide from '@material-ui/core/Slide';
import { TransitionProps } from '@material-ui/core/transitions';
import { AnalysisRow, PipelineStatus } from './Analysis';

interface CancelAnalysisDialogProp {
    title: string,
    open: boolean,
    labeledByPrefix: string,
    describedByPrefix: string,
    onClose: (() => void),
    onAccept: (() => void),
    affectedRows: AnalysisRow[]
}

const Transition = React.forwardRef(function Transition(
    props: TransitionProps & { children?: React.ReactElement<any, any> },
    ref: React.Ref<unknown>,
) {
    return <Slide direction="up" ref={ref} {...props} />;
});

export default function CancelAnalysisDialog({ title, open, labeledByPrefix, describedByPrefix, onClose, onAccept, affectedRows }: CancelAnalysisDialogProp) {

    const message = `Do you really want to stop ${affectedRows.length > 1 ? "these analyses" : "this analysis"}? Stopping an analysis will delete all intermediate files and progress. Input files will remain untouched.`;

    const rowsToCancel = affectedRows.filter((row) => row.state === PipelineStatus.RUNNING);
    const rowsToSkip = affectedRows.filter((row) => row.state !== PipelineStatus.RUNNING);


    const cancelMessage = `The following analyses are currently running and will be cancelled: ${rowsToCancel.map(val => val.analysis_id)}`;
    const skipMessage = `The following analyses are not running, and will be skipped: ${rowsToSkip.map(val => val.analysis_id)}`;

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
                        {message} <br/>
                        <i>The following analyses are currently running and will be cancelled: </i> 
                        {`${rowsToCancel.map(val => val.analysis_id)}`} <br/>
                        <i>The following analyses are not running, and will be skipped: </i> 
                        {`${rowsToSkip.map(val => val.analysis_id)}`}
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose} color="primary">
                        Cancel
          </Button>
                    <Button onClick={onAccept} color="primary">
                        Stop Analysis
          </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
}