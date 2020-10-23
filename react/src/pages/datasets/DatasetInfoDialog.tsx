import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Dialog, DialogTitle, DialogContent, Paper, Typography,Grid, IconButton } from '@material-ui/core';
import { Close } from '@material-ui/icons';
import { Dataset } from '../utils';

const useStyles = makeStyles(theme => ({
    datasetInfo: {
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

const getInfo = (subtitle: string, value: string | number | null) => {
    let val: string;
    if (typeof value === 'number')
        val = value.toString();
    else if (typeof value === 'string')
        val = value;
    else
        val = "";

    return (
        <Typography variant="body1" gutterBottom><b>{subtitle}:</b> {val}</Typography>
    );
}

const stringifyBool = (value: boolean) => {
    return value ? 'Yes' : 'No';
}

interface DialogProp {
    open: boolean,
    dataset: Dataset,
    onClose: (() => void),
}

export default function DatasetInfoDialog({ dataset, open, onClose }: DialogProp) {
    const classes = useStyles();
    const labeledBy = "dataset-info-dialog-slide-title";

    return (
        <Dialog onClose={onClose} aria-labelledby={labeledBy} open={open} maxWidth='lg' fullWidth={true}>
            <DialogHeader id={labeledBy} onClose={onClose}>
                Details of Dataset ID {dataset.dataset_id}
            </DialogHeader>
            <DialogContent className={classes.datasetInfo} dividers>
                <Paper className={classes.paper} elevation={2}>
                    <Grid container spacing={2} justify="space-evenly">
                        <Grid item xs={6}>
                            {getInfo('Dataset ID', dataset.dataset_id)}
                            {getInfo('Dataset Type', dataset.dataset_type)}
                            {getInfo('Participant Codename', dataset.participant_codename)}
                            {getInfo('Family Codename', dataset.family_codename)}
                            {getInfo('Tissue ID', dataset.tissue_sample_id)}
                            {getInfo('Tissue Type', dataset.tissue_sample_type)}
                        </Grid>
                        <Grid item xs={6}>
                            {getInfo('Notes', dataset.notes)}
                            {getInfo('Created', dataset.created)}
                            {getInfo('Created By', dataset.created_by)}
                            {getInfo('Updated', dataset.updated)}
                            {getInfo('Updated By', dataset.updated_by)}
                        </Grid>
                        <Grid item xs={6}>
                            {getInfo('Batch ID', dataset.batch_id)}
                            {getInfo('HPF Path', dataset.input_hpf_path)}
                            {getInfo('Condition', dataset.condition)}
                            {getInfo('Extraction Protocol', dataset.extraction_protocol)}
                            {getInfo('Capture Kit', dataset.capture_kit)}
                            {getInfo('Discriminator', dataset.discriminator)}
                        </Grid>
                        <Grid item xs={6}>
                            {getInfo('Library Prep Method', dataset.library_prep_method)}
                            {getInfo('Library Prep Date', dataset.library_prep_date)}
                            {getInfo('Read Length', dataset.read_length)}
                            {getInfo('Read Type', dataset.read_type)}
                            {getInfo('Sequencing ID', dataset.sequencing_id)}
                            {getInfo('Sequencing Centre', dataset.sequencing_centre)}
                        </Grid>
                    </Grid>
                </Paper>
            </DialogContent>
        </Dialog>
    );
}
