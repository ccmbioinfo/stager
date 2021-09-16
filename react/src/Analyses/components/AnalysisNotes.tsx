import React, { useMemo } from "react";
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
}));

export default function AnalysisNotes(props: AnalysisNotesProps) {
    const classes = useStyles();
    const analysisQuery = useAnalysisQuery(props.analysis.analysis_id);
    const datasets = useMemo(
        () => (analysisQuery.isSuccess ? analysisQuery.data.datasets || [] : []),
        [analysisQuery]
    ) as DatasetWithNotes[];
    const datasetsWithNotes = datasets.filter(d => d.dataset_notes && d.participant_notes);
    console.log(datasets);

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
            {datasetsWithNotes.length > 0 ? (
                <>
                    <Typography variant="h6">Notes</Typography>
                    {datasetsWithNotes.map(dataset => (
                        <>
                            <Divider className={classes.divider} />
                            <Typography>
                                Comment by {dataset.updated_by} at {dataset.updated}
                            </Typography>
                            <Typography variant="subtitle1">
                                Dataset {dataset.dataset_id}
                            </Typography>
                            <Typography variant="body1">
                                Participant: {dataset.participant_notes}
                            </Typography>
                            <Typography variant="body1">
                                Dataset: {dataset.dataset_notes}
                            </Typography>
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
