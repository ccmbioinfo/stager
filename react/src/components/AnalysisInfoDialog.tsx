import React, { useEffect, useState } from "react";
import { Dialog, Divider, DialogContent } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { Dns } from "@material-ui/icons";
import { formatDateString, getDatasetInfoList, createFieldObj } from "../functions";
import { Analysis, Dataset, Pipeline } from "../typings";
import DialogHeader from "./DialogHeader";
import DetailSection from "./DetailSection";
import InfoList from "./InfoList";
import { useEnumsQuery } from "../hooks";

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
    const [datasets, setDatasets] = useState<Dataset[]>([]);
    const [pipeline, setPipeline] = useState<Pipeline>();
    const labeledBy = "analysis-info-dialog-slide-title";
    const { data: enums } = useEnumsQuery();

    useEffect(() => {
        fetch("/api/analyses/" + props.analysis.analysis_id)
            .then(response => response.json())
            .then(data => {
                setDatasets(data.datasets);
                setPipeline(data.pipeline);
            })
            .catch(error => {});
    }, [props.analysis]);

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
