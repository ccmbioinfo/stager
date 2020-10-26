import React, { useEffect, useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Dialog, DialogTitle, DialogContent, Paper, Typography,Grid, IconButton, Collapse, Button, List, ListItem, ListItemAvatar, ListItemText, ListItemIcon, Box } from '@material-ui/core';
import { Close, ShowChart, ExpandLess, ExpandMore } from '@material-ui/icons';
import { Dataset, Analysis, Sample } from '../utils';

const useStyles = makeStyles(theme => ({
    datasetInfo: {
        paddingLeft: theme.spacing(2),
        paddingRight: theme.spacing(2),
    },
    paper: {
        padding: theme.spacing(2),
        marginBottom: theme.spacing(3),
    },
    listPaper: {
        padding: theme.spacing(1),
        margin: theme.spacing(1)
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
    },
    box: {
        padding: theme.spacing(2),
        margin: theme.spacing(1)
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
    const [showAnalysis, setShowAnalysis] = useState<boolean[]>([]);

    function clickAnalysis(index: number) {
        try {
            // toggle
            setShowAnalysis(
                showAnalysis.map((val, i) => index === i ? !val : val)
            );
        } catch (error) {
            console.error(error);
        }
    }

    useEffect(() => {
        fetch('/api/datasets/'+dataset_id)
        .then(response => response.json())
        .then(data => {
            let temp = Object.assign({}, { ...data, analyses: undefined, tissue_sample: undefined });
            setDataset(temp as Dataset);
            setAnalyses(data.analyses as Analysis[]);
            setShowAnalysis((data.analyses as Analysis[]).map(val => false));
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
                            {getInfo('Sequencing Centre', dataset.sequencing_centre)}
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
                        <Grid item xs={12}>
                            <Typography variant="h6">Associated Tissue Sample</Typography>
                        </Grid>
                        <Grid item xs={6}>
                            {getInfo('Sample ID', sample.tissue_sample_id)}
                            {getInfo('Sample Type', sample.tissue_sample_type)}
                            {getInfo('Extraction Date', sample.extraction_date)}
                            {getInfo('Tissue Processing Protocol', sample.tissue_processing)}
                        </Grid>
                        <Grid item xs={6}>
                            {getInfo('Notes', sample.notes)}
                            {getInfo('Created', sample.created)}
                            {getInfo('Created By', sample.created_by)}
                            {getInfo('Updated', sample.updated)}
                            {getInfo('Updated By', sample.updated_by)}
                        </Grid>
                    </Grid>
                </Paper>
                }

                {analyses.length > 0 && showAnalysis.length === analyses.length &&
                <Paper className={classes.paper} elevation={2}>
                    <Typography variant="h6">Analyses which use this dataset</Typography>
                    <List>
                    {analyses.map((analysis, index) =>
                    <Paper key={`analysis-${index}`} className={classes.listPaper} elevation={1}>
                        <ListItem  button onClick={() => clickAnalysis(index)}>
                            <ListItemIcon>
                                <ShowChart/>
                            </ListItemIcon>
                            <ListItemText
                            primary={`Analysis ID ${analysis.analysis_id}`}
                            secondary={`Current State: ${analysis.state} - Click for more details`}
                            />
                            {showAnalysis[index] ? <ExpandLess /> : <ExpandMore />}
                        </ListItem>
                        <Collapse in={showAnalysis[index]}>
                            <Box className={classes.box}>
                            <Grid container spacing={2} justify="space-evenly" className={classes.grid}>
                                <Grid item xs={6}>
                                    {getInfo('Analysis ID', analysis.analysis_id)}
                                    {getInfo('State', analysis.analysisState)}
                                    {getInfo('Pipeline ID', analysis.pipeline_id)}
                                    {getInfo('Assigned to', analysis.assignee)}
                                    {getInfo('HPF Path', analysis.result_hpf_path)}
                                    {getInfo('qSub ID', analysis.qsubID)}
                                </Grid>
                                <Grid item xs={6}>
                                    {getInfo('Notes', analysis.notes)}
                                    {getInfo('Requested', analysis.requested)}
                                    {getInfo('Requested By', analysis.requester)}
                                    {getInfo('Started', analysis.started)}
                                    {getInfo('Last Updated', analysis.updated)}
                                </Grid>
                            </Grid>
                            </Box>
                        </Collapse>
                    </Paper>
                    )}
                    </List>
                </Paper>
                }
            </DialogContent>
        </Dialog>
    );
}
