import React, { useEffect, useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Dialog, DialogTitle, DialogContent, Paper, Typography,Grid, IconButton, Collapse, Button, Divider } from '@material-ui/core';
import { Close } from '@material-ui/icons';
import { Dataset, Analysis, Sample } from '../utils';

const useStyles = makeStyles(theme => ({
    datasetInfo: {
        paddingLeft: theme.spacing(2),
        paddingRight: theme.spacing(2),
    },
    paper: {
        padding: theme.spacing(1),
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
    grid: {
        paddingBottom: theme.spacing(2)
    }
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
    dataset_id: string,
    onClose: (() => void),
}

export default function DatasetInfoDialog({ dataset_id, open, onClose }: DialogProp) {
    const classes = useStyles();
    const labeledBy = "dataset-info-dialog-slide-title";

    const [dataset, setDataset] = useState<Dataset>();
    const [analyses, setAnalyses] = useState<Analysis[]>([]);
    const [sample, setSample] = useState<Sample>();

    const [moreDetails, setMoreDetails] = useState(false);

    useEffect(() => {
        fetch('/api/datasets/'+dataset_id)
        .then(response => response.json())
        .then(data => {
            let temp = Object.assign({}, { ...data, analyses: undefined, tissue_sample: undefined });
            setDataset(temp as Dataset);
            setAnalyses(data.analyses as Analysis[]);
            setSample(data.tissue_sample as Sample);
        })
        .catch(error => {console.error(error)});

    }, [dataset_id]);

    return (
        <Dialog onClose={onClose} aria-labelledby={labeledBy} open={open} maxWidth='lg' fullWidth={true}>
            <DialogHeader id={labeledBy} onClose={onClose}>
                Details of Dataset ID {dataset_id}
            </DialogHeader>
            <DialogContent className={classes.datasetInfo} dividers>
                <Paper className={classes.paper} elevation={2}>
                    {dataset &&
                    <>
                    <Grid container spacing={2} justify="space-evenly" className={classes.grid}>
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
                    </Grid>
                    <Collapse in={moreDetails}>
                    <Grid container spacing={2} justify="space-evenly">
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
                    </Collapse>
                    <Button onClick={() => {setMoreDetails(!moreDetails)}}>
                        {moreDetails ? "Hide" : "Show"} more details
                    </Button>
                    </>
                    }
                </Paper>

                {sample &&
                <Paper className={classes.paper} elevation={2}>
                   <Grid container spacing={2} justify="space-evenly" className={classes.grid}>
                        <Grid item xs={6}>
                            {getInfo('Sample ID', sample.sampleID)}
                            {getInfo('Sample Type', sample.sampleType)}
                            {getInfo('Extraction Date', sample.extractionDate)}
                            {getInfo('Tissue Processing Protocol', sample.tissueProcessing)}
                        </Grid>
                        <Grid item xs={6}>
                            {getInfo('Notes', sample.notes)}
                            {getInfo('Created', sample.created)}
                            {getInfo('Created By', sample.createBy)}
                            {getInfo('Updated', sample.updated)}
                            {getInfo('Updated By', sample.updatedBy)}
                        </Grid>
                    </Grid>
                </Paper>
                }

                {analyses.length > 0 &&
                <Paper className={classes.paper} elevation={2}>
                    Analyses go here
                </Paper>
                }
            </DialogContent>
        </Dialog>
    );
}
