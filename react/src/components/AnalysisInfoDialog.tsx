import React, { useMemo } from "react";
import { Button, Dialog, DialogContent, Divider } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { Dns, Replay } from "@material-ui/icons";
import { useSnackbar } from "notistack";
import { createFieldObj, formatDateString, getDatasetInfoList } from "../functions";
import { useAnalysisCreateMutation, useAnalysisQuery, useEnumsQuery } from "../hooks";
import { Analysis, Pipeline } from "../typings";
import DetailSection from "./DetailSection";
import DialogHeader from "./DialogHeader";
import InfoList from "./InfoList";

const useStyles = makeStyles(theme => ({
    dialogContent: {
        padding: theme.spacing(0),
        margin: theme.spacing(0),
    },
    infoSection: {
        margin: theme.spacing(3),
    },
    headerButton: {
        marginLeft: theme.spacing(2),
    },
}));

function getAnalysisFields(analysis: Analysis, pipeline: Pipeline | undefined) {
    return [
        createFieldObj("Assigned to", analysis.assignee),
        createFieldObj("Requested by", analysis.requester),
        createFieldObj("Status", analysis.analysis_state),
        createFieldObj("Last Updated", formatDateString(analysis.updated)),
        createFieldObj("Notes", analysis.notes),
        createFieldObj("Pipeline", `${pipeline?.pipeline_name} ${pipeline?.pipeline_version}`),
        createFieldObj("Pipeline ID", analysis.pipeline_id),
        createFieldObj("Supported Types", pipeline?.supported_types),
    ];
}

interface AlertInfoDialogProp {
    open: boolean;
    analysis: Analysis;
    onClose: () => void;
}

export default function AnalysisInfoDialog(props: AlertInfoDialogProp) {
    const classes = useStyles();
    const analysisQuery = useAnalysisQuery(props.analysis.analysis_id);
    const datasets = useMemo(
        () => (analysisQuery.isSuccess ? analysisQuery.data.datasets || [] : []),
        [analysisQuery]
    );
    const pipeline = useMemo(
        () => (analysisQuery.isSuccess ? analysisQuery.data.pipeline : undefined),
        [analysisQuery]
    );
    const mutation = useAnalysisCreateMutation();
    const labeledBy = "analysis-info-dialog-slide-title";
    const { data: enums } = useEnumsQuery();
    const { enqueueSnackbar } = useSnackbar();

    return (
        <Dialog
            onClose={props.onClose}
            aria-labelledby={labeledBy}
            open={props.open}
            maxWidth="md"
            fullWidth={true}
        >
            <DialogHeader id={labeledBy} onClose={props.onClose}>
                Details of Analysis ID {props.analysis.analysis_id}
                <Button
                    className={classes.headerButton}
                    variant="contained"
                    size="small"
                    endIcon={<Replay />}
                    onClick={() => {
                        mutation.mutate(
                            { type: "reanalysis", analysis_id: props.analysis.analysis_id },
                            {
                                onSuccess: () => {
                                    enqueueSnackbar(
                                        `Re-analysis of analysis ${props.analysis.analysis_id} requested.`
                                    );
                                },
                                onError: async response => {
                                    const error = (await response.json()).error;
                                    enqueueSnackbar(
                                        `Failed to request re-analysis of ${props.analysis.analysis_id}: ${response.status} - ${error}`,
                                        { variant: "error" }
                                    );
                                },
                            }
                        );
                    }}
                >
                    Request Re-analysis
                </Button>
            </DialogHeader>
            <DialogContent className={classes.dialogContent} dividers>
                <div className={classes.infoSection}>
                    <DetailSection
                        fields={getAnalysisFields(props.analysis, pipeline)}
                        enums={enums}
                    />
                </div>
                <Divider />
                <div className={classes.infoSection}>
                    {datasets.length > 0 && (
                        <InfoList
                            infoList={getDatasetInfoList(datasets)}
                            title="Associated Datasets"
                            enums={enums}
                            icon={<Dns />}
                            linkPath="/datasets"
                        />
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
