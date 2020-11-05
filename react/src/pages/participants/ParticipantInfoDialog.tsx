import React, { useState, useEffect } from "react";
import { makeStyles } from "@material-ui/core/styles";
import { Dialog, DialogContent, Grid, Divider } from "@material-ui/core";
import { formatDateString } from "../utils/functions";
import { Participant, Analysis } from "../utils/typings";
import { FieldDisplay, DialogHeader } from "../utils/components";
import SampleTable from "./SampleTable";
import AnalysisList from "./AnalysisList";

const useStyles = makeStyles(theme => ({
    dialogContent: {
        margin: theme.spacing(0),
        padding: theme.spacing(0),
    },
    infoSection: {
        margin: theme.spacing(3),
    },
}));

interface DialogProp {
    open: boolean;
    participant: Participant;
    onClose: () => void;
}

export default function ParticipantInfoDialog({ participant, open, onClose }: DialogProp) {
    const classes = useStyles();
    const labeledBy = "participant-info-dialog-slide-title";
    const [analyses, setAnalyses] = useState<Analysis[]>([]);

    //get mock data
    useEffect(() => {
        fetch("/api/datasets/1")
            .then(response => response.json())
            .then(data => {
                setAnalyses(data.analyses as Analysis[]);
            })
            .catch(error => {
                console.error(error);
            });
    }, [participant]);

    return (
        <Dialog
            onClose={onClose}
            aria-labelledby={labeledBy}
            open={open}
            maxWidth="lg"
            fullWidth={true}
        >
            <DialogHeader id={labeledBy} onClose={onClose}>
                Details of Participant {participant.participant_codename}
            </DialogHeader>
            <DialogContent className={classes.dialogContent} dividers>
                <div className={classes.infoSection}>
                    <Grid container spacing={2} justify="space-evenly">
                        <Grid item xs={6}>
                            <FieldDisplay
                                title="Participant ID"
                                value={participant.participant_id}
                            />
                            <FieldDisplay title="Family ID" value={participant.family_id} />
                            <FieldDisplay
                                title="Family Codename"
                                value={participant.family_codename}
                            />
                            <FieldDisplay title="Sex" value={participant.sex} />
                            <FieldDisplay title="Affected" value={participant.affected} />
                            <FieldDisplay title="Solved" value={participant.solved} />
                        </Grid>
                        <Grid item xs={6}>
                            <FieldDisplay title="Notes" value={participant.notes} />
                            <FieldDisplay
                                title="Time of Creation"
                                value={formatDateString(participant.created)}
                            />
                            <FieldDisplay title="Created By" value={participant.created_by} />
                            <FieldDisplay
                                title="Time of Update"
                                value={formatDateString(participant.updated)}
                            />
                            <FieldDisplay title="Updated By" value={participant.updated_by} />
                        </Grid>
                    </Grid>
                </div>
                <Divider />
                <div>
                    <SampleTable samples={participant.tissue_samples} />
                </div>
                <Divider />
                <div className={classes.infoSection}>
                    <AnalysisList analyses={analyses} />
                </div>
            </DialogContent>
        </Dialog>
    );
}
