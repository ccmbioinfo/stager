 import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Dialog, DialogTitle, DialogContent, IconButton, Typography,Grid } from '@material-ui/core';
import { Participant } from './MockData';
import ParticipantInfoTable from './ParticipantInfoTable';
import AnalysisTable from './AnalysisTable';

interface DialogProp {
    open: boolean,
    participant: Participant,
    onClose: (() => void),
}

const useStyles = makeStyles(theme => ({
    participantInfo: {
        paddingLeft: theme.spacing(2),
        paddingRight: theme.spacing(2),
    },
}));

const getSubtitle = (subtitle: string, value: string) => {
    return (
        <Typography variant="body1" gutterBottom>
            {subtitle}: {value}
        </Typography>
    )
}

const stringifyBool = (value: boolean) => {
    return value ? 'Yes' : 'No'
}

export default function ParticipantInfoDialog({ participant, open, onClose  }: DialogProp) {
    const classes = useStyles()
    const labeledBy = "participant-info-dialog-slide-title"

    return (
        <Dialog onClose={onClose} aria-labelledby={labeledBy} open={open} maxWidth='lg' fullWidth={true}>
            <DialogTitle id={labeledBy}>
                Participant: {participant.participantCodename}
            </DialogTitle>
            <DialogContent className={classes.participantInfo} dividers>
                <Grid container spacing={2} justify="space-evenly">
                    <Grid item xs={6}>
                        {getSubtitle('Participant ID', participant.participantID)}
                        {getSubtitle('Family ID', participant.familyID)}
                        {getSubtitle('Family Codename', participant.familyCodename)}
                        {getSubtitle('Sex', participant.sex)}
                        {getSubtitle('Affected', stringifyBool(participant.affected))}
                        {getSubtitle('Solved', stringifyBool(participant.solved))}
                    </Grid>
                    <Grid item xs={6}>
                        {getSubtitle('Notes', participant.note)}
                        {getSubtitle('Time of Creation', participant.created)}
                        {getSubtitle('Created By', participant.createdBy.toString())}
                        {getSubtitle('Time of Last Update', participant.updated)}
                        {getSubtitle('Updated By', participant.updatedBy.toString())}
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogContent>
                <ParticipantInfoTable participantID={participant.participantID} />
            </DialogContent>
            <DialogContent dividers>
                <AnalysisTable participantID={participant.participantID} />
            </DialogContent>
        </Dialog>
  );
}
