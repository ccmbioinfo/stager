import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { makeStyles, Chip, IconButton, TextField } from "@material-ui/core";
import { PlayArrow, Delete, Cancel, Visibility } from "@material-ui/icons";
import MaterialTable, { MTableToolbar } from "material-table";
import { useSnackbar } from "notistack";
import { toKeyValue, formatDateString, exportCSV, rowDiff } from "../../functions";
import { KeyValue, Dataset, Pipeline, Option } from "../../typings";
import AnalysisRunnerDialog from "./AnalysisRunnerDialog";
import DatasetInfoDialog from "./DatasetInfoDialog";
import { Note, FileLinkingComponent } from "../../components";
import LinkedFilesButton from "./LinkedFilesButton";
import { useFetchCache } from "../../contexts/fetchCache";

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

interface DatasetTableProps {
    isAdmin: boolean;
}

export default function DatasetTable({ isAdmin }: DatasetTableProps) {
    const classes = useStyles();
    const [showRunner, setRunner] = useState(false);
    const [selectedDatasets, setSelectedDatasets] = useState<Dataset[]>([]);
    const [datasetTypeFilter, setDatasetTypeFilter] = useState<string[]>([]);

    const [datasets, setDatasets] = useState<Dataset[]>([]);
    const [pipelines, setPipelines] = useState<Pipeline[]>([]);

    const enums = useFetchCache("/api/enums");
    let tissueSampleTypes: KeyValue = {};
    let datasetTypes: KeyValue = {};
    let conditions: KeyValue = {};
    if (enums) {
        tissueSampleTypes = toKeyValue(enums.TissueSampleType as string[]);
        datasetTypes = toKeyValue(enums.DatasetType as string[]);
        conditions = toKeyValue(enums.DatasetCondition as string[]);
    }

    const [files, setFiles] = useState<string[]>([]);

    const [showInfo, setShowInfo] = useState(false);
    const [infoDataset, setInfoDataset] = useState<Dataset>();

    const { enqueueSnackbar } = useSnackbar();

    const { id: paramID } = useParams<{ id?: string }>();

    useEffect(() => {
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
        fetch("/api/unlinked").then(async response => {
            if (response.ok) {
                setFiles(((await response.json()) as string[]).sort());
            } else {
                console.error(
                    `GET /api/unlinked failed with ${response.status}: ${response.statusText}`
                );
            }
        });
    }, []);

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
                    }}
                    onUpdate={(dataset_id: string, newDataset: { [key: string]: any }) => {
                        setDatasets(
                            datasets.map(dataset => {
                                if (dataset.dataset_id === dataset_id) {
                                    const updatedDataset = { ...dataset, ...newDataset };
                                    setInfoDataset(updatedDataset);
                                    return updatedDataset;
                                } else {
                                    return dataset;
                                }
                            })
                        );
                    }}
                />
            )}
            <MaterialTable
                columns={[
                    { title: "Participant", field: "participant_codename", editable: "never" },
                    { title: "Family", field: "family_codename", editable: "never" },
                    {
                        title: "Tissue Sample",
                        field: "tissue_sample_type",
                        editable: "never",
                        lookup: tissueSampleTypes,
                    },
                    {
                        title: "Type",
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
                        render: rowData => <Note>{rowData.notes}</Note>,
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
                        title: "Files",
                        field: "linked_files",
                        grouping: false,
                        // can search by number of files, or by file name
                        customFilterAndSearch: (filter: string, rowData) =>
                            filter === "" + rowData.linked_files.length ||
                            rowData.linked_files.some(name => name.includes(filter)),
                        customSort: (a, b) => a.linked_files.length - b.linked_files.length,
                        render: data => <LinkedFilesButton fileNames={data.linked_files} />,
                        editComponent: props => (
                            <FileLinkingComponent
                                values={props.rowData.linked_files}
                                options={files.map(file => ({ title: file, inputValue: file }))}
                                onEdit={(newValue: string[]) => props.onChange(newValue)}
                                disableTooltip
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
                    {
                        title: "ID",
                        field: "dataset_id",
                        editable: "never",
                        defaultFilter: paramID,
                    },
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
                    exportAllData: true,
                    exportButton: { csv: true, pdf: false },
                    exportCsv: (columns, data) => exportCSV(columns, data, "Datasets"),
                }}
                editable={{
                    onRowUpdate: async (newDataset, oldDataset) => {
                        const diffDataset = rowDiff<Dataset>(newDataset, oldDataset);
                        const response = await fetch(`/api/datasets/${newDataset.dataset_id}`, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify(diffDataset),
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
                            // Remove the new value from the list of unlinked files to prevent reuse
                            // Readd the previous value if there was one since it is available again
                            const removeUsed = files.filter(
                                file => !newDataset.linked_files.includes(file)
                            );
                            setFiles(
                                oldDataset && oldDataset.linked_files.length > 0
                                    ? [...oldDataset.linked_files, ...removeUsed].sort()
                                    : removeUsed
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
                                        key={type}
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
                        hidden: !isAdmin,
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
            />
        </div>
    );
}
