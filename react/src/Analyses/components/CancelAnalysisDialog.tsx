import React, { useMemo } from "react";
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Divider,
} from "@material-ui/core";
import { checkPipelineStatusChange } from "../../functions";
import { Analysis, PipelineStatus } from "../../typings";

interface CancelAnalysisDialogProp {
    title: string;
    open: boolean;
    labeledByPrefix: string;
    describedByPrefix: string;
    onClose: () => void;
    onAccept: () => void;
    affectedRows: Analysis[];
}

export default function CancelAnalysisDialog({
    title,
    open,
    labeledByPrefix,
    describedByPrefix,
    onClose,
    onAccept,
    affectedRows,
}: CancelAnalysisDialogProp) {
    const message = `Do you really want to stop ${
        affectedRows.length > 1 ? "these analyses" : "this analysis"
    }? Stopping an analysis will delete all intermediate files and progress. Input files will remain untouched.`;

    const [rowsToCancel, rowsToSkip] = useMemo(() => {
        const cancel: Analysis[] = [];
        const skip: Analysis[] = [];

        for (const row of affectedRows) {
            if (checkPipelineStatusChange(row.analysis_state, PipelineStatus.CANCELLED)) {
                cancel.push(row);
            } else {
                skip.push(row);
            }
        }
        return [cancel, skip];
    }, [affectedRows]);

    const labeledBy = `${labeledByPrefix}-cancel-alert-dialog-title`;
    const describedBy = `${describedByPrefix}-cancel-alert-dialog-description`;

    return (
        <div>
            <Dialog
                open={open}
                keepMounted
                onClose={onClose}
                aria-labelledby={labeledBy}
                aria-describedby={describedBy}
            >
                <DialogTitle id={labeledBy}>{title}</DialogTitle>
                <DialogContent>
                    <DialogContentText id={describedBy}>
                        {message} <br />
                        <Divider />
                        <i>
                            The following analyses are currently running and will be cancelled:{" "}
                        </i>{" "}
                        <br />
                        {rowsToCancel.map(val => val.analysis_id).join(", ")} <br />
                        <i>The following analyses are not running, and will be skipped: </i> <br />
                        {rowsToSkip.map(val => val.analysis_id).join(", ")}
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
