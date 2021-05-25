import React, { useState } from "react";
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    FormControlLabel,
    FormLabel,
    Grid,
    makeStyles,
    Paper,
    Radio,
    RadioGroup,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography,
} from "@material-ui/core";
import { useSnackbar } from "notistack";
import { useAnalysisCreateMutation, useEnumsQuery, usePipelinesQuery } from "../../hooks";
import { AnalysisPriority, Dataset } from "../../typings";

interface AnalysisRunnerDialogProps {
    datasets: Dataset[];
    open: boolean;
    onClose: () => void;
}

const useStyles = makeStyles(theme => ({
    text: {
        paddingBottom: theme.spacing(1),
    },
}));

export default function AnalysisRunnerDialog({
    open,
    onClose,
    datasets,
}: AnalysisRunnerDialogProps) {
    const classes = useStyles();
    const titleId = "analysis-runner-alert-dialog-slide-title";
    const descriptionId = "analysis-runner-alert-dialog-slide-description";
    const pipelineQuery = usePipelinesQuery();
    const pipelines = pipelineQuery.data || [];
    const [pipeline, setPipeline] = useState(NaN);
    const [analysisPriority, setAnalysisPriority] = useState<AnalysisPriority | "None" | "">("");
    const [notes, setNotes] = useState("");
    const mutation = useAnalysisCreateMutation();
    const { data: enums } = useEnumsQuery();

    const { enqueueSnackbar } = useSnackbar();

    return (
        <Dialog
            open={open}
            onClose={onClose}
            keepMounted
            aria-labelledby={titleId}
            aria-describedby={descriptionId}
            maxWidth="md"
            fullWidth
        >
            <DialogTitle id={titleId}>Request Analysis</DialogTitle>
            <DialogContent>
                <Typography id={descriptionId} variant="body1" className={classes.text}>
                    Run a pipeline using the selected datasets. A full analysis can take a day to
                    several days depending on the number of datasets and the requested pipeline.
                </Typography>
                <Grid container direction="column">
                    <Grid item>
                        <FormControl component="fieldset">
                            <FormLabel component="legend" className={classes.text}>
                                Pipelines:
                            </FormLabel>
                            <RadioGroup
                                row
                                aria-label="Pipelines"
                                name="pipelines"
                                value={pipeline}
                                onChange={event => setPipeline(parseInt(event.target.value))}
                            >
                                {pipelines.map(
                                    ({ pipeline_id, pipeline_name, pipeline_version }) => (
                                        <FormControlLabel
                                            key={pipeline_id}
                                            label={`${pipeline_name} ${pipeline_version}`}
                                            value={pipeline_id}
                                            control={<Radio color="primary" />}
                                        />
                                    )
                                )}
                            </RadioGroup>
                        </FormControl>
                    </Grid>
                    <Grid item>
                        <FormControl component="fieldset">
                            <FormLabel component="legend" className={classes.text}>
                                Priority:
                            </FormLabel>
                            <RadioGroup
                                row
                                aria-label="Priorities"
                                name="priorities"
                                value={analysisPriority}
                                onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                                    setAnalysisPriority(event.target.value as AnalysisPriority)
                                }
                            >
                                {enums?.PriorityType.concat("None").map(priorityName => (
                                    <FormControlLabel
                                        key={priorityName}
                                        label={priorityName}
                                        value={priorityName}
                                        control={<Radio color="primary" />}
                                    />
                                ))}
                            </RadioGroup>
                        </FormControl>
                    </Grid>
                    <Grid item>
                        <FormControl component="fieldset" fullWidth>
                            <FormLabel component="legend" className={classes.text}>
                                Notes:
                            </FormLabel>
                            <TextField
                                aria-label="Notes"
                                name="notes"
                                variant="filled"
                                multiline
                                fullWidth
                                margin="normal"
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                            />
                        </FormControl>
                    </Grid>
                </Grid>
                <Typography variant="subtitle1" className={classes.text}>
                    Datasets:
                </Typography>
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Participant</TableCell>
                                <TableCell>Family</TableCell>
                                <TableCell>Tissue Sample</TableCell>
                                <TableCell>Type</TableCell>
                                <TableCell>Condition</TableCell>
                                <TableCell align="right">Input Files</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {datasets.map(dataset => (
                                <TableRow key={dataset.dataset_id}>
                                    <TableCell>{dataset.participant_codename}</TableCell>
                                    <TableCell>{dataset.family_codename}</TableCell>
                                    <TableCell>{dataset.tissue_sample_type}</TableCell>
                                    <TableCell>{dataset.dataset_type}</TableCell>
                                    <TableCell>{dataset.condition}</TableCell>
                                    <TableCell align="right">
                                        {dataset.linked_files.join(", ")}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </DialogContent>
            <DialogActions>
                <Button variant="outlined" onClick={onClose}>
                    Cancel
                </Button>
                <Button
                    disabled={!pipeline}
                    variant="contained"
                    onClick={async () => {
                        onClose();
                        const priority =
                            !analysisPriority || analysisPriority === "None"
                                ? {}
                                : { priority: analysisPriority };
                        mutation.mutate(
                            {
                                datasets: datasets.map(d => d.dataset_id),
                                pipeline_id: pipeline,
                                ...priority,
                                notes: notes,
                            },
                            {
                                onSuccess: analysis => {
                                    let p = pipelines.find(
                                        p => p.pipeline_id === parseInt(analysis.pipeline_id)
                                    );
                                    enqueueSnackbar(
                                        `Analysis ID ${analysis.analysis_id} created of ${datasets.length} datasets with pipeline ${p?.pipeline_name} ${p?.pipeline_version}`,
                                        { variant: "success" }
                                    );
                                },
                                onError: async response => {
                                    const errorText = await response.text();
                                    enqueueSnackbar(
                                        `Analysis could not be requested. Error: ${response.status} - ${errorText}`,
                                        { variant: "error" }
                                    );
                                },
                            }
                        );
                    }}
                    color="primary"
                >
                    Run analysis
                </Button>
            </DialogActions>
        </Dialog>
    );
}
