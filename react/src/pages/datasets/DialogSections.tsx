import React, { useEffect, useState } from "react";
import {
    Box,
    Button,
    Collapse,
    Grid,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    makeStyles,
    Paper,
    Typography,
} from "@material-ui/core";
import { ExpandLess, ExpandMore, ShowChart } from "@material-ui/icons";
import { formatDateString } from "../utils/functions";
import { FieldDisplay } from "../utils/components";
import { Analysis, Dataset, Sample } from "../utils/typings";
const useStyles = makeStyles(theme => ({
    paper: {
        padding: theme.spacing(2),
    },
    listPaper: {
        padding: theme.spacing(1),
        margin: theme.spacing(1),
    },
    grid: {
        paddingBottom: theme.spacing(2),
    },
    box: {
        padding: theme.spacing(2),
        margin: theme.spacing(1),
    },
}));

const gridSpacing = 2;
const titleWidth = 12;
const infoWidth = 6;

export function DatasetDetailSection(props: { dataset?: Dataset; elevation?: number }) {
    const classes = useStyles();
    const [moreDetails, setMoreDetails] = useState(false);
    const dataset = props.dataset;

    return (
        <>
            {dataset && (
                <>
                    <Grid container spacing={gridSpacing} justify="space-evenly">
                        <Grid item xs={infoWidth}>
                            <FieldDisplay title="Dataset ID" value={dataset.dataset_id} />
                            <FieldDisplay title="Dataset Type" value={dataset.dataset_type} />
                            <FieldDisplay
                                title="Participant Codename"
                                value={dataset.participant_codename}
                            />
                            <FieldDisplay title="Family Codename" value={dataset.family_codename} />
                            <FieldDisplay title="Tissue ID" value={dataset.tissue_sample_id} />
                            <FieldDisplay
                                title="Sequencing Centre"
                                value={dataset.sequencing_centre}
                            />
                        </Grid>
                        <Grid item xs={infoWidth}>
                            <FieldDisplay title="Notes" value={dataset.notes} />
                            <FieldDisplay
                                title="Created"
                                value={formatDateString(dataset.created)}
                            />
                            <FieldDisplay title="Created By" value={dataset.created_by} />
                            <FieldDisplay
                                title="Updated"
                                value={formatDateString(dataset.updated)}
                            />
                            <FieldDisplay title="Updated By" value={dataset.updated_by} />
                        </Grid>
                    </Grid>
                    <Collapse in={moreDetails}>
                        <Grid container spacing={gridSpacing} justify="space-evenly">
                            <Grid item xs={infoWidth}>
                                <FieldDisplay title="Batch ID" value={dataset.batch_id} />
                                <FieldDisplay title="HPF Path" value={dataset.input_hpf_path} />
                                <FieldDisplay title="Condition" value={dataset.condition} />
                                <FieldDisplay
                                    title="Extraction Protocol"
                                    value={dataset.extraction_protocol}
                                />
                                <FieldDisplay title="Capture Kit" value={dataset.capture_kit} />
                                <FieldDisplay title="Discriminator" value={dataset.discriminator} />
                            </Grid>
                            <Grid item xs={infoWidth}>
                                <FieldDisplay
                                    title="Library Prep Method"
                                    value={dataset.library_prep_method}
                                />
                                <FieldDisplay
                                    title="Library Prep Date"
                                    value={dataset.library_prep_date}
                                />
                                <FieldDisplay title="Read Length" value={dataset.read_length} />
                                <FieldDisplay title="Read Type" value={dataset.read_type} />
                                <FieldDisplay title="Sequencing ID" value={dataset.sequencing_id} />
                            </Grid>
                        </Grid>
                    </Collapse>
                    <Button
                        variant="contained"
                        size="small"
                        onClick={() => {
                            setMoreDetails(!moreDetails);
                        }}
                    >
                        {moreDetails ? "Hide" : "Show"} more details
                    </Button>
                </>
            )}
        </>
    );
}

export function SampleDetailSection(props: { sample?: Sample }) {
    const classes = useStyles();
    const sample = props.sample;

    return (
        <>
            {sample && (
                <Grid container spacing={gridSpacing} justify="space-evenly">
                    <Grid item xs={titleWidth}>
                        <Typography variant="h6">Associated Tissue Sample</Typography>
                    </Grid>
                    <Grid item xs={infoWidth}>
                        <FieldDisplay title="Sample ID" value={sample.tissue_sample_id} />
                        <FieldDisplay title="Sample Type" value={sample.tissue_sample_type} />
                        <FieldDisplay
                            title="Extraction Date"
                            value={formatDateString(sample.extraction_date)}
                        />
                        <FieldDisplay
                            title="Tissue Processing Protocol"
                            value={sample.tissue_processing}
                        />
                    </Grid>
                    <Grid item xs={infoWidth}>
                        <FieldDisplay title="Notes" value={sample.notes} />
                        <FieldDisplay title="Created" value={formatDateString(sample.created)} />
                        <FieldDisplay title="Created By" value={sample.created_by} />
                        <FieldDisplay title="Updated" value={formatDateString(sample.updated)} />
                        <FieldDisplay title="Updated By" value={sample.updated_by} />
                    </Grid>
                </Grid>
            )}
        </>
    );
}

export function AnalysisListSection(props: { analyses: Analysis[] }) {
    const classes = useStyles();
    const [showAnalysis, setShowAnalysis] = useState<boolean[]>([]);
    const analyses = props.analyses;

    function clickAnalysis(index: number) {
        // toggle
        setShowAnalysis(
            showAnalysis.map((val, i) => {
                return index === i ? !val : val;
            })
        );
        console.log(showAnalysis);
    }

    useEffect(() => {
        setShowAnalysis(props.analyses.map(val => false));
    }, [props.analyses]);

    return (
        <>
            {analyses.length > 0 && showAnalysis.length === analyses.length && (
                <>
                    <Typography variant="h6">Analyses which use this dataset</Typography>
                    <List>
                        {analyses.map((analysis, index) => (
                            <Paper
                                key={`analysis-${index}`}
                                className={classes.listPaper}
                                elevation={1}
                            >
                                <ListItem button onClick={() => clickAnalysis(index)}>
                                    <ListItemIcon>
                                        <ShowChart />
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={`Analysis ID ${analysis.analysis_id}`}
                                        secondary={`Current State: ${analysis.analysis_state} - Click for more details`}
                                    />
                                    {showAnalysis[index] ? <ExpandLess /> : <ExpandMore />}
                                </ListItem>
                                <Collapse in={showAnalysis[index]}>
                                    <Box className={classes.box}>
                                        <Grid
                                            container
                                            spacing={gridSpacing}
                                            justify="space-evenly"
                                        >
                                            <Grid item xs={infoWidth}>
                                                <FieldDisplay
                                                    title="Analysis ID"
                                                    value={analysis.analysis_id}
                                                />
                                                <FieldDisplay
                                                    title="State"
                                                    value={analysis.analysis_state}
                                                />
                                                <FieldDisplay
                                                    title="Pipeline ID"
                                                    value={analysis.pipeline_id}
                                                />
                                                <FieldDisplay
                                                    title="Assigned to"
                                                    value={analysis.assignee}
                                                />
                                                <FieldDisplay
                                                    title="HPF Path"
                                                    value={analysis.result_hpf_path}
                                                />
                                                <FieldDisplay
                                                    title="qSub ID"
                                                    value={analysis.qsubID}
                                                />
                                            </Grid>
                                            <Grid item xs={infoWidth}>
                                                <FieldDisplay
                                                    title="Notes"
                                                    value={analysis.notes}
                                                />
                                                <FieldDisplay
                                                    title="Requested"
                                                    value={formatDateString(analysis.requested)}
                                                />
                                                <FieldDisplay
                                                    title="Requested By"
                                                    value={analysis.requester}
                                                />
                                                <FieldDisplay
                                                    title="Started"
                                                    value={formatDateString(analysis.started)}
                                                />
                                                <FieldDisplay
                                                    title="Last Updated"
                                                    value={formatDateString(analysis.updated)}
                                                />
                                            </Grid>
                                        </Grid>
                                    </Box>
                                </Collapse>
                            </Paper>
                        ))}
                    </List>
                </>
            )}
        </>
    );
}
