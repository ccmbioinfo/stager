import React, { useEffect, useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import { Dialog, DialogContent, Divider } from "@material-ui/core";
import { ShowChart } from "@material-ui/icons";
import { DialogHeader } from "../utils/components/components";
import { Dataset, Analysis, Sample } from "../utils/typings";
import {
    formatDateString,
    getAnalysisInfoList,
    getDatasetTitles,
    getDatasetValues,
    getSecDatasetTitles,
    getSecDatasetValues,
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

function getSamplesTitles() {
    return [
        "Sample ID",
        "Sample Type",
        "Extraction Date",
        "Tissue Processing Protocol",
        "Notes",
        "Created",
        "Created By",
        "Updated",
        "Updated By",
    ];
}

function getSampleValues(sample: Sample) {
    return [
        sample.tissue_sample_id,
        sample.tissue_sample_type,
        formatDateString(sample.extraction_date),
        sample.tissue_processing,
        sample.notes,
        formatDateString(sample.created),
        sample.created_by,
        formatDateString(sample.updated),
        sample.updated_by,
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
    }, [dataset_id]);

    return (
        <Dialog
            onClose={onClose}
            aria-labelledby={labeledBy}
            open={open}
            maxWidth="lg"
            fullWidth={true}
        >
            <DialogHeader id={labeledBy} onClose={onClose}>
                Details of Dataset ID {dataset_id}
            </DialogHeader>
            <DialogContent className={classes.datasetInfo} dividers>
                <div className={classes.infoSection}>
                    {dataset && (
                        <></>
                        // <DetailSection
                        //     titles={getDatasetTitles()}
                        //     values={getDatasetValues(dataset)}
                        //     collapsibleTitles={getSecDatasetTitles()}
                        //     collapsibleValues={getSecDatasetValues(dataset)}
                        // />
                    )}
                </div>
                <Divider />
                <div className={classes.infoSection}>
                    {sample && (
                        // <DetailSection
                        //     titles={getSamplesTitles()}
                        //     values={getSampleValues(sample)}
                        //     title="Associated Tissue Sample"
                        // />
                        <></>
                    )}
                </div>
                <Divider />
                <div className={classes.infoSection}>
                    {analyses.length > 0 && (
                        <InfoList
                            infoList={getAnalysisInfoList(analyses)}
                            title="Analyses which use this dataset"
                            icon={<ShowChart />}
                        />
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
