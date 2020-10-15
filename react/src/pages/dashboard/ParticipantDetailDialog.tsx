 import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Dialog, DialogTitle, DialogContent, Paper, Typography,Grid, IconButton } from '@material-ui/core';
import { Close } from '@material-ui/icons';
import { Participant } from './MockData';
import SampleTable from './SampleTable';
import AnalysisTable from './AnalysisTable';

const useStyles = makeStyles(theme => ({
    participantInfo: {
        paddingLeft: theme.spacing(2),
        paddingRight: theme.spacing(2),
    },
    paper: {
        padding: theme.spacing(2),
        marginBottom: theme.spacing(3),
    },
    root: {
        margin: 0,
        padding: theme.spacing(2),
    },
    closeButton: {
        position: 'absolute',
        right: theme.spacing(1),
        top: theme.spacing(1),
        color: theme.palette.grey[500],
    },
}));

interface DialogTitleProps {
    id: string;
    children: React.ReactNode;
    onClose: () => void;
}

const DialogHeader = ((props: DialogTitleProps) => {
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
});

const getInfo = (subtitle: string, value: string) => {
    return (
        <Typography variant="body1" gutterBottom>{subtitle}: {value}</Typography>
    );
}

const stringifyBool = (value: boolean) => {
    return value ? 'Yes' : 'No';
}

interface DialogProp {
    open: boolean,
    participant: Participant,
    onClose: (() => void),
}

export default function ParticipantDetailDialog({ participant, open, onClose  }: DialogProp) {
    const classes = useStyles();
    const labeledBy = "participant-info-dialog-slide-title";

    return (
        <Dialog onClose={onClose} aria-labelledby={labeledBy} open={open} maxWidth='lg' fullWidth={true}>
            <DialogHeader id={labeledBy} onClose={onClose}>
                Participant: {participant.participant_codename}
            </DialogHeader>
            <DialogContent className={classes.participantInfo} dividers>
                <Paper className={classes.paper} elevation={2}>
                    <Grid container spacing={2} justify="space-evenly">
                        <Grid item xs={6}>
                            {getInfo('Participant ID', participant.participant_id)}
                            {getInfo('Family ID', participant.family_id)}
                            {getInfo('Family Codename', participant.family_codename)}
                            {getInfo('Sex', participant.sex)}
                            {getInfo('Affected', stringifyBool(participant.affected))}
                            {getInfo('Solved', stringifyBool(participant.solved))}
                        </Grid>
                        <Grid item xs={6}>
                            {getInfo('Notes', participant.notes)}
                            {getInfo('Time of Creation', participant.created)}
                            {getInfo('Created By', participant.created_by.toString())}
                            {getInfo('Time of Update', participant.updated)}
                            {getInfo('Updated By', participant.updated_by.toString())}
                        </Grid>
                    </Grid>
                </Paper>
                <SampleTable samples={participant.tissue_samples} />
                <AnalysisTable participantID={participant.participant_id} />
            </DialogContent>
        </Dialog>
    );
}
