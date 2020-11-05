import React, { useEffect, useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import { Dialog, DialogContent, Divider } from "@material-ui/core";
import { DialogHeader } from "../utils/components";
import { Dataset, Analysis, Sample } from "../utils/typings";
import { AnalysisListSection, DatasetDetailSection, SampleDetailSection } from "./DialogSections";

const useStyles = makeStyles(theme => ({
    datasetInfo: {
        padding: theme.spacing(0),
        margin: theme.spacing(0),
    },
    infoSection: {
        margin: theme.spacing(3),
    },
}));

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
                    <DatasetDetailSection dataset={dataset} />
                </div>
                <Divider />
                <div className={classes.infoSection}>
                    <SampleDetailSection sample={sample} />
                </div>
                <Divider />
                <div className={classes.infoSection}>
                    <AnalysisListSection analyses={analyses} />
                </div>
            </DialogContent>
        </Dialog>
    );
}
