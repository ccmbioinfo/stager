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
    Paper,
    Radio,
    RadioGroup,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
    makeStyles,
} from "@material-ui/core";
import { useSnackbar } from "notistack";
import { Analysis, Dataset, Pipeline } from "../../typings";

interface AnalysisRunnerDialogProps {
    datasets: Dataset[];
    pipelines: Pipeline[];
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
    pipelines,
}: AnalysisRunnerDialogProps) {
    const classes = useStyles();
    const titleId = "analysis-runner-alert-dialog-slide-title";
    const descriptionId = "analysis-runner-alert-dialog-slide-description";
    const [pipeline, setPipeline] = useState(NaN);

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
                        {pipelines.map(({ pipeline_id, pipeline_name, pipeline_version }) => (
                            <FormControlLabel
                                label={`${pipeline_name} ${pipeline_version}`}
                                value={pipeline_id}
                                control={<Radio color="primary" />}
                            />
                        ))}
                    </RadioGroup>
                </FormControl>
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
                <Button variant="outlined" onClick={onClose} color="primary">
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    onClick={async () => {
                        onClose();
                        const response = await fetch("/api/analyses", {
                            method: "POST",
                            body: JSON.stringify({
                                datasets: datasets.map(d => d.dataset_id),
                                pipeline_id: pipeline,
                            }),
                            headers: {
                                "Content-Type": "application/json",
                            },
                        });
                        if (response.ok) {
                            const analysis = (await response.json()) as Analysis;

                            let p = pipelines.find(
                                p => p.pipeline_id === parseInt(analysis.pipeline_id)
                            );
                            enqueueSnackbar(
                                `Analysis ID ${analysis.analysis_id} created of ${datasets.length} datasets with pipeline ${p?.pipeline_name} ${p?.pipeline_version}`,
                                { variant: "success" }
                            );
                        } else {
                            const errorText = await response.text();
                            enqueueSnackbar(
                                `Analysis could not be requested. Error: ${response.status} - ${errorText}`,
                                { variant: "error" }
                            );
                        }
                    }}
                    color="primary"
                >
                    Run analysis
                </Button>
            </DialogActions>
        </Dialog>
    );
}
