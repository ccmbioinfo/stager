import React, { useEffect, useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import { Dialog, DialogContent, Divider } from "@material-ui/core";
import { ShowChart } from "@material-ui/icons";
import { DialogHeader } from "../utils/components/components";
import { Dataset, Analysis, Sample } from "../utils/typings";
import {
    formatDateString,
    getAnalysisInfoList,
    getDatasetFields,
    getSecDatasetFields,
    createFieldObj,
} from "../utils/functions";
import DetailSection from "../utils/components/DetailSection";
import InfoList from "../utils/components/InfoList";

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
        createFieldObj("Sample ID", sample.tissue_sample_id),
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
    dataset_id: string;
    onClose: () => void;
}

export default function DatasetInfoDialog({ dataset_id, open, onClose }: DialogProp) {
    const classes = useStyles();
    const labeledBy = "dataset-info-dialog-slide-title";

    const [dataset, setDataset] = useState<Dataset>();
    const [analyses, setAnalyses] = useState<Analysis[]>([]);
    const [sample, setSample] = useState<Sample>();
    //for updating the dialog content when re-open the dialog
    const [num, reRender] = useState(0);
    useEffect(() => {
        fetch("/api/datasets/" + dataset_id)
            .then(response => response.json())
            .then(data => {
                setDataset(data as Dataset);
                setAnalyses(data.analyses as Analysis[]);
                setSample(data.tissue_sample as Sample);
            })
            .catch(error => {
                console.error(error);
            });
    }, [dataset_id, num]);

    return (
        <Dialog
            onClose={onClose}
            aria-labelledby={labeledBy}
            open={open}
            maxWidth="lg"
            fullWidth={true}
        >
            <DialogHeader
                id={labeledBy}
                onClose={() => {
                    onClose();
                    reRender(n => n + 1);
                }}
            >
                Details of Dataset ID {dataset_id}
            </DialogHeader>
            <DialogContent className={classes.datasetInfo} dividers>
                <div className={classes.infoSection}>
                    {dataset && (
                        <DetailSection
                            fields={getDatasetFields(dataset)}
                            collapsibleFields={getSecDatasetFields(dataset)}
                            editable
                            dataType="dataset"
                            dataID={dataset.dataset_id}
                            // callback={()=> {setTest(n=>n+1)}}
                        />
                    )}
                </div>
                <Divider />
                <div className={classes.infoSection}>
                    {sample && (
                        <DetailSection
                            fields={getSamplesFields(sample)}
                            title="Associated Tissue Sample"
                        />
                    )}
                </div>
                <Divider />
                <div className={classes.infoSection}>
                    {analyses.length > 0 && (
                        <InfoList
                            infoList={getAnalysisInfoList(analyses)}
                            title="Analyses which use this dataset"
                            icon={<ShowChart />}
                            linkPath="/analysis"
                        />
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
