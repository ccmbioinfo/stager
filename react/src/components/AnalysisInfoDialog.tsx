import React, { useMemo } from "react";
import { Button, Dialog, DialogContent, Divider } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { Dns, Replay } from "@material-ui/icons";
import { useSnackbar } from "notistack";
import { DetailSection, DialogHeader, InfoList, LoadingIndicator } from ".";
import { getDatasetInfoList } from "../functions";
import {
    useAnalysisCreateMutation,
    useAnalysisQuery,
    useEnumsQuery,
    useErrorSnackbar,
} from "../hooks";
import { Analysis, Field } from "../typings";

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

function getAnalysisFields(analysis: Analysis): Field[] {
    return [
        {
            title: "Kind",
            editable: false,
            value: analysis.kind,
            fieldName: "kind",
        },
        { title: "Assigned to", editable: false, value: analysis.assignee, fieldName: "assignee" },
        {
            title: "Requested by",
            editable: false,
            value: analysis.requester,
            fieldName: "requester",
        },
        {
            title: "Status",
            editable: false,
            value: analysis.analysis_state,
            fieldName: "analysis_state",
        },
        {
            title: "Last Updated",
            editable: false,
            type: "timestamp",
            value: analysis.updated,
            fieldName: "updated",
        },
        {
            title: "Scheduler ID",
            editable: false,
            value: analysis.scheduler_id,
            fieldName: "scheduler_id",
        },
        {
            title: "Path Prefix",
            editable: false,
            value: analysis.result_path,
            fieldName: "result_path",
        },
        { title: "Notes", editable: false, value: analysis.notes, fieldName: "notes" },
    ];
}

interface AlertInfoDialogProp {
    open: boolean;
    analysis: Analysis;
    onClose: () => void;
    refreshTable?: () => void;
}

export default function AnalysisInfoDialog(props: AlertInfoDialogProp) {
    const classes = useStyles();
    const analysisQuery = useAnalysisQuery(props.analysis.analysis_id);
    const loadingOpen = analysisQuery.isLoading;
    const datasets = useMemo(
        () => (analysisQuery.isSuccess ? analysisQuery.data.datasets || [] : []),
        [analysisQuery]
    );
    const { mutate: analysisUpdateMutate, isLoading: loadingUpdate } = useAnalysisCreateMutation();
    const labeledBy = "analysis-info-dialog-slide-title";
    const { data: enums } = useEnumsQuery();
    const { enqueueSnackbar } = useSnackbar();
    const enqueueErrorSnackbar = useErrorSnackbar();

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
                        analysisUpdateMutate(
                            { type: "reanalysis", analysis_id: props.analysis.analysis_id },
                            {
                                onSuccess: () => {
                                    enqueueSnackbar(
                                        `Re-analysis of analysis ${props.analysis.analysis_id} requested.`
                                    );
                                    if (props.refreshTable) {
                                        props.refreshTable();
                                    }
                                },
                                onError: async response => {
                                    enqueueErrorSnackbar(
                                        response,
                                        `Failed to request re-analysis of ${props.analysis.analysis_id}`
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
                    <DetailSection fields={getAnalysisFields(props.analysis)} enums={enums} />
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
            <LoadingIndicator open={loadingOpen || loadingUpdate} />
        </Dialog>
    );
}
