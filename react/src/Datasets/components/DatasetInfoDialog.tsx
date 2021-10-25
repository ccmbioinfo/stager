import React, { useMemo } from "react";
import { Dialog, DialogContent, Divider } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { ShowChart } from "@material-ui/icons";

import { useSnackbar } from "notistack";

import { DetailSection, DialogHeader, InfoList } from "../../components";
import {
    createFieldObj,
    formatDateString,
    formatFieldValue,
    getAnalysisInfoList,
    getDatasetFields,
    getSecDatasetFields,
} from "../../functions";
import {
    useDatasetQuery,
    useDatasetUpdateMutation,
    useEnumsQuery,
    useErrorSnackbar,
} from "../../hooks";
import { Dataset, Field, Sample } from "../../typings";

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
    dataset_id: string;
    onClose: () => void;
}

export default function DatasetInfoDialog({ dataset_id, onClose, open }: DialogProp) {
    const classes = useStyles();
    const labeledBy = "dataset-info-dialog-slide-title";
    const { data: dataset } = useDatasetQuery(dataset_id);
    const { data: enums } = useEnumsQuery();
    const analyses = useMemo(() => dataset?.analyses, [dataset]);
    const sample = useMemo(() => dataset?.tissue_sample, [dataset]);

    const datasetUpdateMutation = useDatasetUpdateMutation();

    const { enqueueSnackbar } = useSnackbar();
    const enqueueErrorSnackbar = useErrorSnackbar();

    const updateDataset = async (fields: Field[]) => {
        const newData = fields
            .map(field => {
                if (field.fieldName && !field.disableEdit) {
                    return { [field.fieldName]: formatFieldValue(field.value, false, true) };
                } else return false;
            })
            .filter(Boolean)
            .reduce((acc, curr) => ({ ...acc, ...curr }), {} as Dataset);

        datasetUpdateMutation.mutate(
            {
                ...newData,
                dataset_id,
            },
            {
                onSuccess: receiveDataset => {
                    enqueueSnackbar(
                        `Dataset ID ${receiveDataset.dataset_id} updated successfully`,
                        {
                            variant: "success",
                        }
                    );
                },
                onError: response => {
                    console.error(
                        `PATCH /api/datasets/${dataset_id} failed with ${response.status}: ${response.statusText}`
                    );
                    enqueueErrorSnackbar(response, `Failed to edit Dataset ID ${dataset_id}`);
                },
            }
        );
    };

    return (
        <Dialog onClose={onClose} aria-labelledby={labeledBy} open={open} maxWidth="lg" fullWidth>
            <DialogHeader id={labeledBy} onClose={onClose}>
                Details of Dataset ID {dataset_id}
            </DialogHeader>
            <DialogContent className={classes.datasetInfo} dividers>
                <div className={classes.infoSection}>
                    {dataset && (
                        <DetailSection
                            fields={getDatasetFields(dataset)}
                            enums={enums}
                            editable={true}
                            columnWidth={4}
                            collapsibleFields={getSecDatasetFields(dataset)}
                            update={updateDataset}
                        />
                    )}
                </div>
                <Divider />
                <div className={classes.infoSection}>
                    {sample && (
                        <DetailSection
                            columnWidth={4}
                            editable={false}
                            update={updateDataset}
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
