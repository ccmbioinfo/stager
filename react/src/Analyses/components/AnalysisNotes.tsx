import React from "react";
import { Divider, Popover, Typography } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { useAnalysisQuery } from "../../hooks";
import { Analysis, Dataset } from "../../typings";

interface AnalysisNotesProps {
    analysis: Analysis;
    anchorEl: HTMLButtonElement | null;
    open: boolean;
    onClose: () => void;
}

interface DatasetWithNotes extends Dataset {
    participant_notes: string;
    dataset_notes: string;
}

const useStyles = makeStyles(theme => ({
    paper: {
        padding: theme.spacing(2),
    },
    divider: {
        margin: theme.spacing(1, 0),
    },
    comment: {
        fontWeight: 500,
    },
}));

export default function AnalysisNotes(props: AnalysisNotesProps) {
    const classes = useStyles();
    const { data: analysisQueryResults } = useAnalysisQuery(props.analysis.analysis_id);
    const analysisWithNotes = (
        (analysisQueryResults && (analysisQueryResults.datasets as DatasetWithNotes[])) ||
        []
    ).filter(dataset => dataset.notes || dataset.participant_notes);

    return (
        <Popover
            PaperProps={{ className: classes.paper }}
            open={props.open}
            anchorEl={props.anchorEl}
            onClose={props.onClose}
            anchorOrigin={{
                vertical: "bottom",
                horizontal: "left",
            }}
        >
            {analysisWithNotes.length > 0 ? (
                <>
                    <Typography variant="h6">Notes</Typography>
                    {analysisWithNotes.map(dataset => (
                        <>
                            <Divider className={classes.divider} />
                            <Typography className={classes.comment}>
                                Comment by {dataset.updated_by} for dataset{" "}
                                {dataset.participant_codename}/{dataset.tissue_sample_type}/
                                {dataset.dataset_type}
                            </Typography>
                            {dataset.participant_notes && (
                                <Typography variant="body1">
                                    Participant: {dataset.participant_notes}
                                </Typography>
                            )}
                            {dataset.notes && (
                                <Typography variant="body1">Dataset: {dataset.notes}</Typography>
                            )}
                        </>
                    ))}
                </>
            ) : (
                <Typography>
                    There are no additional notes from the associated datasets and participants.
                </Typography>
            )}
        </Popover>
    );
}
