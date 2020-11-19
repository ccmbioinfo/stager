import React, { useEffect, useState } from "react";
import { Dialog, Divider, DialogContent } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { Dns } from "@material-ui/icons";
import { formatDateString, getDatasetInfoList, createFieldObj } from "../functions";
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
                    <DetailSection fields={getAnalysisFields(analysis, pipeline)} />
                </div>
                <Divider />
                <div className={classes.infoSection}>
                    {datasets.length > 0 && (
                        <InfoList
                            infoList={getDatasetInfoList(datasets)}
                            title="Associated Datasets"
                            icon={<Dns />}
                            linkPath="/datasets"
                        />
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
