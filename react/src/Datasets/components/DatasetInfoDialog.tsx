import React, { useMemo } from "react";
import { Dialog, DialogContent, Divider } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { ShowChart } from "@material-ui/icons";
import { DetailSection, DialogHeader, InfoList } from "../../components";
import {
    createFieldObj,
    formatDateString,
    getAnalysisInfoList,
    getDatasetFields,
    getSecDatasetFields,
} from "../../functions";
import { useDatasetQuery, useEnumsQuery } from "../../hooks";
import { Dataset, Sample } from "../../typings";

const useStyles = makeStyles(theme => ({
    datasetInfo: {
        padding: theme.spacing(0),
        margin: theme.spacing(0),
    },
    infoSection: {
        margin: theme.spacing(3),
    },
}));

function getSamplesFields(sample: Sample) {
    return [
        createFieldObj("Sample Type", sample.tissue_sample_type),
        createFieldObj("Extraction Date", formatDateString(sample.extraction_date)),
        createFieldObj("Tissue Processing Protocol", sample.tissue_processing),
        createFieldObj("Notes", sample.notes),
        createFieldObj("Created", formatDateString(sample.created)),
        createFieldObj("Created By", sample.created_by),
        createFieldObj("Updated", formatDateString(sample.updated)),
        createFieldObj("Updated By", sample.updated_by),
    ];
}

interface DialogProp {
    open: boolean;
    dataset: Dataset;
    onClose: () => void;
}

export default function DatasetInfoDialog(props: DialogProp) {
    const classes = useStyles();
    const labeledBy = "dataset-info-dialog-slide-title";
    const { data: dataset } = useDatasetQuery(props.dataset.dataset_id);
    const analyses = useMemo(() => dataset?.analyses, [dataset]);
    const sample = useMemo(() => dataset?.tissue_sample, [dataset]);

    const { data: enums } = useEnumsQuery();

    return (
        <Dialog
            onClose={props.onClose}
            aria-labelledby={labeledBy}
            open={props.open}
            maxWidth="lg"
            fullWidth
        >
            <DialogHeader id={labeledBy} onClose={props.onClose}>
                Details of Dataset ID {props.dataset.dataset_id}
            </DialogHeader>
            <DialogContent className={classes.datasetInfo} dividers>
                <div className={classes.infoSection}>
                    {props.dataset && (
                        <DetailSection
                            fields={getDatasetFields(props.dataset)}
                            enums={enums}
                            columnWidth={4}
                            collapsibleFields={getSecDatasetFields(props.dataset)}
                            dataInfo={{
                                type: "dataset",
                                ID: props.dataset.dataset_id,
                                identifier: props.dataset.dataset_id,
                            }}
                        />
                    )}
                </div>
                <Divider />
                <div className={classes.infoSection}>
                    {sample && (
                        <DetailSection
                            columnWidth={4}
                            fields={getSamplesFields(sample)}
                            enums={enums}
                            title="Associated Tissue Sample"
                        />
                    )}
                </div>
                <Divider />
                <div className={classes.infoSection}>
                    {analyses && analyses.length > 0 && (
                        <InfoList
                            infoList={getAnalysisInfoList(analyses)}
                            title="Analyses which use this dataset"
                            enums={enums}
                            icon={<ShowChart />}
                            linkPath="/analysis"
                        />
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
