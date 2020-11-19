import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { makeStyles, Chip, IconButton, TextField } from "@material-ui/core";
import { PlayArrow, Delete, Cancel, Visibility } from "@material-ui/icons";
import MaterialTable, { MTableToolbar } from "material-table";
import { useSnackbar } from "notistack";
import { toKeyValue, formatDateString } from "../utils/functions";
import { KeyValue, Dataset, Pipeline } from "../utils/typings";
import AnalysisRunnerDialog from "./AnalysisRunnerDialog";
import DatasetInfoDialog from "./DatasetInfoDialog";

const useStyles = makeStyles(theme => ({
    chip: {
        color: "primary",
        marginRight: "10px",
        colorPrimary: theme.palette.primary,
    },
    chipBar: {
        marginLeft: "24px",
        marginTop: "6px",
    },
}));

export default function DatasetTable() {
    const classes = useStyles();
    const [showRunner, setRunner] = useState(false);
    const [selectedDatasets, setSelectedDatasets] = useState<Dataset[]>([]);
    const [datasetTypeFilter, setDatasetTypeFilter] = useState<string[]>([]);

    const [datasets, setDatasets] = useState<Dataset[]>([]);
    const [pipelines, setPipelines] = useState<Pipeline[]>([]);
    const [tissueSampleTypes, setTissueSampleTypes] = useState<KeyValue>({});
    const [datasetTypes, setDatasetTypes] = useState<KeyValue>({});
    const [conditions, setConditions] = useState<KeyValue>({});

    const [showInfo, setShowInfo] = useState(false);
    const [infoDataset, setInfoDataset] = useState<Dataset>();

    const { enqueueSnackbar } = useSnackbar();

    //for updating the table after the dialog is closed
    const [num, reRender] = useState(0);
    const { id: paramID } = useParams<{ id?: string }>();
    const [paramFilter, setParamFilter] = useState(paramID);

    useEffect(() => {
        fetch("/api/enums").then(async response => {
            if (response.ok) {
                const enums = await response.json();
                setTissueSampleTypes(toKeyValue(enums.TissueSampleType));
                setDatasetTypes(toKeyValue(enums.DatasetType));
                setConditions(toKeyValue(enums.DatasetCondition));
            } else {
                console.error(
                    `GET /api/enums failed with ${response.status}: ${response.statusText}`
                );
            }
        });
        fetch("/api/datasets").then(async response => {
            if (response.ok) {
                const data = (await response.json()) as any[];
                setDatasets(data);
            } else {
                console.error(
                    `GET /api/datasets failed with ${response.status}: ${response.statusText}`
                );
            }
        });
        fetch("/api/pipelines").then(async response => {
            if (response.ok) {
                setPipelines(await response.json());
            } else {
                console.error(
                    `GET /api/pipelines failed with ${response.status}: ${response.statusText}`
                );
            }
        });
    }, [num]);

    return (
        <div>
            <AnalysisRunnerDialog
                datasets={selectedDatasets}
                pipelines={pipelines}
                open={showRunner}
                onClose={() => setRunner(false)}
            />
            {infoDataset && (
                <DatasetInfoDialog
                    dataset={infoDataset}
                    open={showInfo}
                    onClose={() => {
                        setShowInfo(false);
                        reRender(n => n + 1);
                    }}
                />
            )}
            <MaterialTable
                columns={[
                    {
                        title: "Dataset ID",
                        field: "dataset_id",
                        editable: "never",
                        defaultFilter: paramFilter,
                    },
                    { title: "Participant", field: "participant_codename", editable: "never" },
                    { title: "Family", field: "family_codename", editable: "never" },
                    {
                        title: "Tissue Sample",
                        field: "tissue_sample_type",
                        editable: "never",
                        lookup: tissueSampleTypes,
                    },
                    {
                        title: "Dataset Type",
                        field: "dataset_type",
                        defaultFilter: datasetTypeFilter,
                        lookup: datasetTypes,
                    },
                    {
                        title: "Condition",
                        field: "condition",
                        lookup: conditions,
                    },
                    {
                        title: "Notes",
                        field: "notes",
                        grouping: false,
                        editComponent: props => (
                            <TextField
                                multiline
                                value={props.value}
                                onChange={event => props.onChange(event.target.value)}
                                rows={4}
                                fullWidth
                            />
                        ),
                    },
                    {
                        title: "Updated",
                        field: "updated",
                        type: "string",
                        editable: "never",
                        render: rowData => formatDateString(rowData.updated),
                    },
                    { title: "Updated By", field: "updated_by", editable: "never" },
                ]}
                data={datasets}
                title="Datasets"
                options={{
                    pageSize: 10,
                    selection: true,
                    filtering: true,
                    search: false,
                    padding: "dense",
                    grouping: true,
                }}
                editable={{
                    onRowUpdate: async (newDataset, oldDataset) => {
                        const response = await fetch(`/api/datasets/${newDataset.dataset_id}`, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify(newDataset),
                        });
                        if (response.ok) {
                            const updatedDataset = await response.json();
                            // Functional style: make a copy of the current state but replace
                            // the element that changed with the server's response. Mix in with
                            // the old because the PATCH endpoint does not respond with the
                            // participant codename, family codename, or tissue sample type.
                            setDatasets(
                                datasets.map(dataset =>
                                    dataset.dataset_id === newDataset.dataset_id
                                        ? { ...dataset, ...updatedDataset }
                                        : dataset
                                )
                            );
                            enqueueSnackbar(
                                `Dataset ID ${newDataset.dataset_id} updated successfully`,
                                { variant: "success" }
                            );
                        } else {
                            console.error(
                                `PATCH /api/datasets/${newDataset.dataset_id} failed with ${response.status}: ${response.statusText}`
                            );
                            enqueueSnackbar(
                                `Failed to edit Dataset ID ${oldDataset?.dataset_id} - ${response.status} ${response.statusText}`,
                                { variant: "error" }
                            );
                        }
                    },
                }}
                components={{
                    Toolbar: props => (
                        <div>
                            <MTableToolbar {...props} />
                            <div className={classes.chipBar}>
                                {[...new Set(datasets.map(e => e.dataset_type))].map(type => (
                                    <Chip
                                        label={type}
                                        onClick={() => setDatasetTypeFilter([type])}
                                        clickable
                                        className={classes.chip}
                                    />
                                ))}
                                <IconButton
                                    onClick={() => setDatasetTypeFilter([])}
                                    className={classes.chip}
                                >
                                    <Cancel />
                                </IconButton>
                            </div>
                        </div>
                    ),
                }}
                actions={[
                    {
                        tooltip: "Delete selected datasets",
                        icon: Delete,
                        position: "toolbarOnSelect",
                        onClick: (evt, data) => {
                            const sampleString = (data as Dataset[])
                                .map(
                                    dataset =>
                                        `${dataset.participant_codename}/${dataset.tissue_sample_type}/${dataset.dataset_type}`
                                )
                                .join(", ");
                            alert(
                                `Withdraw all datasets and records associated with: ${sampleString}`
                            );
                        },
                    },
                    {
                        tooltip: "Analyze selected datasets",
                        icon: PlayArrow,
                        position: "toolbarOnSelect",
                        onClick: (evt, data) => {
                            setSelectedDatasets(data as Dataset[]);
                            setRunner(true);
                        },
                    },
                    {
                        tooltip: "View dataset details",
                        icon: Visibility,
                        position: "row",
                        onClick: (event, data) => {
                            setInfoDataset(data as Dataset);
                            setShowInfo(true);
                        },
                    },
                ]}
                localization={{
                    header: {
                        actions: "", //remove action buttons' header
                    },
                }}
                onFilterChange={filters => {
                    const newValue = filters.find(filter => filter.column.field === "analysis_id")
                        ?.value;
                    setParamFilter(newValue ? newValue : "");
                }}
            />
        </div>
    );
}
