import React, { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { makeStyles, Chip, IconButton, TextField } from "@material-ui/core";
import { PlayArrow, Delete, Cancel, Visibility } from "@material-ui/icons";
import MaterialTable, { MTableToolbar } from "material-table";
import { useSnackbar } from "notistack";
import { toKeyValue, exportCSV, rowDiff } from "../../functions";
import { Dataset } from "../../typings";
import AnalysisRunnerDialog from "./AnalysisRunnerDialog";
import DatasetInfoDialog from "./DatasetInfoDialog";
import { DateTimeText, DateTimeFilter, Note, FileLinkingComponent } from "../../components";
import LinkedFilesButton from "./LinkedFilesButton";
import {
    useDatasetUpdateMutation,
    useDatasetsQuery,
    useEnumsQuery,
    useMetadatasetTypesQuery,
    useUnlinkedFilesQuery,
} from "../../hooks";
import { useUserContext } from "../../contexts";
import { useQueryClient } from "react-query";

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
    const { user: currentUser } = useUserContext();
    const queryClient = useQueryClient();
    const [showRunner, setRunner] = useState(false);
    const [selectedDatasets, setSelectedDatasets] = useState<Dataset[]>([]);
    const [datasetTypeFilter, setDatasetTypeFilter] = useState<string[]>([]);

    const { data: datasets } = useDatasetsQuery();
    const datasetUpdateMutation = useDatasetUpdateMutation();
    const { data: enums } = useEnumsQuery();
    const { data: metadatasetTypes } = useMetadatasetTypesQuery();
    const datasetTypes = useMemo(
        () => metadatasetTypes && toKeyValue(Object.values(metadatasetTypes).flat()),
        [metadatasetTypes]
    );
    const tissueSampleTypes = useMemo(() => enums?.TissueSampleType, [enums]);
    const conditions = useMemo(() => enums?.DatasetCondition, [enums]);

    const filesQuery = useUnlinkedFilesQuery();
    const files = filesQuery.data || [];

    const [showInfo, setShowInfo] = useState(false);
    const [infoDataset, setInfoDataset] = useState<Dataset>();

    const { enqueueSnackbar } = useSnackbar();

    const { id: paramID } = useParams<{ id?: string }>();

    return (
        <div>
            <AnalysisRunnerDialog
                datasets={selectedDatasets}
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
                        render: rowData => <DateTimeText datetime={rowData.updated} />,
                        filterComponent: props => <DateTimeFilter {...props} />,
                    },
                    { title: "Updated By", field: "updated_by", editable: "never" },
                    {
                        title: "ID",
                        field: "dataset_id",
                        editable: "never",
                        defaultFilter: paramID,
                    },
                ]}
                data={datasets || []}
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
                        if (oldDataset) {
                            datasetUpdateMutation.mutate(
                                {
                                    ...diffDataset,
                                    dataset_id: oldDataset.dataset_id,
                                },
                                {
                                    onSuccess: receivedDataset => {
                                        const removeUsed = files.filter(
                                            file => !receivedDataset.linked_files.includes(file)
                                        );
                                        queryClient.setQueryData(
                                            "unlinked",
                                            oldDataset && oldDataset.linked_files.length > 0
                                                ? [...oldDataset.linked_files, ...removeUsed].sort()
                                                : removeUsed
                                        );
                                        enqueueSnackbar(
                                            `Dataset ID ${newDataset.dataset_id} updated successfully`,
                                            { variant: "success" }
                                        );
                                    },
                                    onError: response => {
                                        console.error(
                                            `PATCH /api/datasets/${newDataset.dataset_id} failed with ${response.status}: ${response.statusText}`
                                        );
                                        enqueueSnackbar(
                                            `Failed to edit Dataset ID ${oldDataset?.dataset_id} - ${response.status} ${response.statusText}`,
                                            { variant: "error" }
                                        );
                                    },
                                }
                            );
                        }
                    },
                }}
                components={{
                    Toolbar: props => (
                        <div>
                            <MTableToolbar {...props} />
                            <div className={classes.chipBar}>
                                {metadatasetTypes &&
                                    Object.entries(
                                        metadatasetTypes
                                    ).map(([metatype, datasetTypes]) => (
                                        <Chip
                                            key={metatype}
                                            label={metatype}
                                            onClick={() => setDatasetTypeFilter(datasetTypes)}
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
                        hidden: !currentUser.is_admin,
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
