import React, { useEffect, useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Dialog, DialogTitle, DialogContent, Paper, Typography,Grid, IconButton, Collapse, Button, List, ListItem, ListItemText, ListItemIcon, Box } from '@material-ui/core';
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

function FieldDisplay(props: { title: string, value: string | number | null }) {
    let val: string;
    if (typeof props.value === 'number')
        val = props.value.toString();
    else if (typeof props.value === 'string')
        val = props.value;
    else
        val = "";

    return <Typography variant="body1" gutterBottom><b>{props.title}:</b> {val}</Typography>;
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
        // toggle
        setShowAnalysis(
            showAnalysis.map((val, i) => index === i ? !val : val)
        );
    }

    useEffect(() => {
        fetch('/api/datasets/'+dataset_id)
        .then(response => response.json())
        .then(data => {
            let temp = { ...data, analyses: undefined, tissue_sample: undefined };
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
                            <FieldDisplay title='Dataset ID' value={dataset.dataset_id} />
                            <FieldDisplay title='Dataset Type' value={dataset.dataset_type} />
                            <FieldDisplay title='Participant Codename' value={dataset.participant_codename} />
                            <FieldDisplay title='Family Codename' value={dataset.family_codename} />
                            <FieldDisplay title='Tissue ID' value={dataset.tissue_sample_id} />
                            <FieldDisplay title='Sequencing Centre' value={dataset.sequencing_centre} />
                        </Grid>
                        <Grid item xs={6}>
                            <FieldDisplay title='Notes' value={dataset.notes} />
                            <FieldDisplay title='Created' value={dataset.created} />
                            <FieldDisplay title='Created By' value={dataset.created_by} />
                            <FieldDisplay title='Updated' value={dataset.updated} />
                            <FieldDisplay title='Updated By' value={dataset.updated_by} />
                        </Grid>
                    </Grid>
                    <Collapse in={moreDetails}>
                    <Grid container spacing={2} justify="space-evenly">
                        <Grid item xs={6}>
                            <FieldDisplay title='Batch ID' value={dataset.batch_id} />
                            <FieldDisplay title='HPF Path' value={dataset.input_hpf_path} />
                            <FieldDisplay title='Condition' value={dataset.condition} />
                            <FieldDisplay title='Extraction Protocol' value={dataset.extraction_protocol} />
                            <FieldDisplay title='Capture Kit' value={dataset.capture_kit} />
                            <FieldDisplay title='Discriminator' value={dataset.discriminator} />
                        </Grid>
                        <Grid item xs={6}>
                            <FieldDisplay title='Library Prep Method' value={dataset.library_prep_method} />
                            <FieldDisplay title='Library Prep Date' value={dataset.library_prep_date} />
                            <FieldDisplay title='Read Length' value={dataset.read_length} />
                            <FieldDisplay title='Read Type' value={dataset.read_type} />
                            <FieldDisplay title='Sequencing ID' value={dataset.sequencing_id} />
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
                            <FieldDisplay title='Sample ID' value={sample.tissue_sample_id} />
                            <FieldDisplay title='Sample Type' value={sample.tissue_sample_type} />
                            <FieldDisplay title='Extraction Date' value={sample.extraction_date} />
                            <FieldDisplay title='Tissue Processing Protocol' value={sample.tissue_processing} />
                        </Grid>
                        <Grid item xs={6}>
                            <FieldDisplay title='Notes' value={sample.notes} />
                            <FieldDisplay title='Created' value={sample.created} />
                            <FieldDisplay title='Created By' value={sample.created_by} />
                            <FieldDisplay title='Updated' value={sample.updated} />
                            <FieldDisplay title='Updated By' value={sample.updated_by} />
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
                            secondary={`Current State: ${analysis.analysis_state} - Click for more details`}
                            />
                            {showAnalysis[index] ? <ExpandLess /> : <ExpandMore />}
                        </ListItem>
                        <Collapse in={showAnalysis[index]}>
                            <Box className={classes.box}>
                            <Grid container spacing={2} justify="space-evenly" className={classes.grid}>
                                <Grid item xs={6}>
                                    <FieldDisplay title='Analysis ID' value={analysis.analysis_id} />
                                    <FieldDisplay title='State' value={analysis.analysis_state} />
                                    <FieldDisplay title='Pipeline ID' value={analysis.pipeline_id} />
                                    <FieldDisplay title='Assigned to' value={analysis.assignee} />
                                    <FieldDisplay title='HPF Path' value={analysis.result_hpf_path} />
                                    <FieldDisplay title='qSub ID' value={analysis.qsubID} />
                                </Grid>
                                <Grid item xs={6}>
                                    <FieldDisplay title='Notes' value={analysis.notes} />
                                    <FieldDisplay title='Requested' value={analysis.requested} />
                                    <FieldDisplay title='Requested By' value={analysis.requester} />
                                    <FieldDisplay title='Started' value={analysis.started} />
                                    <FieldDisplay title='Last Updated' value={analysis.updated} />
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
