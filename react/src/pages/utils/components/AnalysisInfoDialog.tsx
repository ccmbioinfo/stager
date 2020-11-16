import React, { useEffect, useState } from "react";
import { Dialog, Divider, DialogContent } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { Dns } from "@material-ui/icons";
import { formatDateString, getDatasetInfoList } from "../functions";
import { Analysis, Dataset, Pipeline } from "../typings";
import { DialogHeader } from "./components";
import DetailSection from "./DetailSection";
import InfoList from "./InfoList";

const useStyles = makeStyles(theme => ({
    dialogContent: {
        padding: theme.spacing(0),
        margin: theme.spacing(0),
    },
    infoSection: {
        margin: theme.spacing(3),
    },
    datasetInfo: {
        padding: theme.spacing(2),
    },
}));

interface AlertInfoDialogProp {
    open: boolean;
    analysis: Analysis;
    onClose: () => void;
}

function getAnalysisTitles() {
    return [
        "Assigned to",
        "Requested by",
        "Status",
        "Last Updated",
        "Notes",
        "Pipeline",
        "Pipeline ID",
        "Supported Types",
    ];
}

function getAnalysisValues(analysis: Analysis, pipeline: Pipeline | undefined) {
    return [
        analysis.assignee,
        analysis.requester,
        analysis.analysis_state,
        formatDateString(analysis.updated),
        analysis.notes,
        `${pipeline?.pipeline_name} ${pipeline?.pipeline_version}`,
        analysis.pipeline_id,
        pipeline?.supported_types,
    ];
}

export default function AnalysisInfoDialog({ analysis, open, onClose }: AlertInfoDialogProp) {
    const classes = useStyles();

    const [datasets, setDatasets] = useState<Dataset[]>([]);
    const [pipeline, setPipeline] = useState<Pipeline>();
    const labeledBy = "analysis-info-dialog-slide-title";

    useEffect(() => {
        fetch("/api/analyses/" + analysis.analysis_id)
            .then(response => response.json())
            .then(data => {
                setDatasets(data.datasets);
                setPipeline(data.pipeline);
            })
            .catch(error => {});
    }, [analysis]);

    return (
        <Dialog
            onClose={onClose}
            aria-labelledby={labeledBy}
            open={open}
            maxWidth="md"
            fullWidth={true}
        >
            <DialogHeader id={labeledBy} onClose={onClose}>
                Details of Analysis ID {analysis.analysis_id}
            </DialogHeader>
            <DialogContent className={classes.dialogContent} dividers>
                <div className={classes.infoSection}>
                    {/* <DetailSection
                        titles={getAnalysisTitles()}
                        values={getAnalysisValues(analysis, pipeline)}
                    /> */}
                </div>
                <Divider />
                <div className={classes.infoSection}>
                    {datasets.length > 0 && (
                        <InfoList
                            infoList={getDatasetInfoList(datasets)}
                            title="Associated Datasets"
                            icon={<Dns />}
                        />
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
