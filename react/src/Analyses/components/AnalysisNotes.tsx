import React, { useMemo } from "react";
import { Popover, Typography } from "@material-ui/core";
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
        background: theme.palette.warning.main,
    },
}));

export default function AnalysisNotes(props: AnalysisNotesProps) {
    const classes = useStyles();
    const analysisQuery = useAnalysisQuery(props.analysis.analysis_id);
    const datasets = useMemo(
        () => (analysisQuery.isSuccess ? analysisQuery.data.datasets || [] : []),
        [analysisQuery]
    ) as DatasetWithNotes[];

    return datasets.length > 0 ? (
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
            {datasets.map(dataset => (
                <>
                    <Typography>Participant: {dataset.participant_notes}</Typography>
                    <Typography>Dataset: {dataset.dataset_notes}</Typography>
                </>
            ))}
        </Popover>
    ) : null;
}
