import { useMemo } from "react";
import { Dialog, DialogContent, Divider } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { ShowChart } from "@material-ui/icons";
import { useSnackbar } from "notistack";

import { DetailSection, DialogHeader, InfoList, LoadingIndicator } from "../../components";
import {
    formatSubmitValue,
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

function getSamplesFields(sample: Sample): Field[] {
    return [
        {
            title: "Sample Type",
            fieldName: "tissue_sample_type",
            value: sample.tissue_sample_type,
            editable: false,
        },
        {
            title: "Extraction Date",
            value: sample.extraction_date,
            fieldName: "extraction_date",
            type: "timestamp",
            editable: false,
        },
        {
            title: "Tissue Processing Protocol",
            value: sample.tissue_processing,
            fieldName: "tissue_processing",
            editable: false,
        },
        { title: "Notes", value: sample.notes, fieldName: "notes", editable: false },
        {
            title: "Created",
            value: sample.created,
            fieldName: "created",
            type: "timestamp",
            editable: false,
        },
        {
            title: "Created By",
            value: sample.created_by,
            fieldName: "created_by",
            editable: false,
        },
        {
            title: "Updated",
            value: sample.updated,
            fieldName: "updated",
            type: "timestamp",
            editable: false,
        },
        {
            title: "Updated By",
            value: sample.updated_by,
            fieldName: "updated_by",
            editable: false,
        },
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
    const { data: dataset, isLoading: loadingOpen } = useDatasetQuery(dataset_id);
    const { data: enums } = useEnumsQuery();
    const analyses = useMemo(() => dataset?.analyses, [dataset]);
    const sample = useMemo(() => dataset?.tissue_sample, [dataset]);

    const datasetUpdateMutation = useDatasetUpdateMutation();
    const loadingUpdate = datasetUpdateMutation.isLoading;

    const { enqueueSnackbar } = useSnackbar();
    const enqueueErrorSnackbar = useErrorSnackbar();

    const updateDataset = async (fields: Field[]) => {
        const newData = fields
            .map(field => {
                if (field.fieldName && field.editable) {
                    return {
                        [field.fieldName]: formatSubmitValue(field),
                    };
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
            <LoadingIndicator open={loadingOpen || loadingUpdate} />
        </Dialog>
    );
}
