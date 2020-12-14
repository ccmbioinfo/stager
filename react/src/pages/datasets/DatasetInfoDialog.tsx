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
    dataset: Dataset;
    onClose: () => void;
    onUpdate: (dataset_id: string, newDataset: { [key: string]: any }) => void;
}

export default function DatasetInfoDialog({ dataset, open, onClose, onUpdate }: DialogProp) {
    const classes = useStyles();
    const labeledBy = "dataset-info-dialog-slide-title";

    const [analyses, setAnalyses] = useState<Analysis[]>([]);
    const [sample, setSample] = useState<Sample>();

    const [enums, setEnums] = useState<any>();

    useEffect(() => {
        fetch("/api/enums").then(async response => {
            if (response.ok) {
                const enums = await response.json();
                setEnums(enums);
            } else {
                console.error(
                    `GET /api/enums failed with ${response.status}: ${response.statusText}`
                );
            }
        });
    }, []);

    useEffect(() => {
        fetch("/api/datasets/" + dataset.dataset_id)
            .then(response => response.json())
            .then(data => {
                setAnalyses(data.analyses as Analysis[]);
                setSample(data.tissue_sample as Sample);
            })
            .catch(error => {
                console.error(error);
            });
    }, [dataset]);

    return (
        <Dialog onClose={onClose} aria-labelledby={labeledBy} open={open} maxWidth="lg" fullWidth>
            <DialogHeader
                id={labeledBy}
                onClose={() => {
                    onClose();
                }}
            >
                Details of Dataset ID {dataset.dataset_id}
            </DialogHeader>
            <DialogContent className={classes.datasetInfo} dividers>
                <div className={classes.infoSection}>
                    {dataset && (
                        <DetailSection
                            fields={getDatasetFields(dataset)}
                            enums={enums}
                            collapsibleFields={getSecDatasetFields(dataset)}
                            dataInfo={{
                                type: "dataset",
                                ID: dataset.dataset_id,
                                identifier: dataset.dataset_id,
                                onUpdate: onUpdate,
                            }}
                        />
                    )}
                </div>
                <Divider />
                <div className={classes.infoSection}>
                    {sample && (
                        <DetailSection
                            fields={getSamplesFields(sample)}
                            enums={enums}
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
