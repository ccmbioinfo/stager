import React, { useMemo, useRef, useState } from "react";
import { Column, EditComponentProps, MTableToolbar } from "@material-table/core";
import { Chip, IconButton, makeStyles } from "@material-ui/core";
import { Cancel, Delete, PlayArrow, Visibility } from "@material-ui/icons";
import { useSnackbar } from "notistack";
import { useQueryClient } from "react-query";
import { useParams } from "react-router-dom";
import {
    DateFilterComponent,
    DateTimeText,
    EditNotes,
    FileLinkingComponent,
    MaterialTablePrimary,
    Note,
} from "../../components";
import { useUserContext } from "../../contexts";
import { rowDiff, toKeyValue, updateTableFilter } from "../../functions";
import {
    GET_DATASETS_URL,
    useColumnOrderCache,
    useDatasetsPage,
    useDatasetUpdateMutation,
    useDownloadCsv,
    useEnumsQuery,
    useMetadatasetTypesQuery,
    useSortOrderCache,
    useTableFilterCache,
    useUnlinkedFilesQuery,
} from "../../hooks";
import { transformMTQueryToCsvDownloadParams } from "../../hooks/utils";
import { Dataset } from "../../typings";
import AnalysisRunnerDialog from "./AnalysisRunnerDialog";
import DatasetInfoDialog from "./DatasetInfoDialog";
import LinkedFilesButton from "./LinkedFilesButton";

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

const customFileFilterAndSearch = (filter: string, rowData: Dataset) => {
    return (
        filter === "" + rowData.linked_files.length ||
        rowData.linked_files.some(name => name.includes(filter))
    );
};

const EditFilesComponent = (props: EditComponentProps<Dataset>) => {
    const filesQuery = useUnlinkedFilesQuery();
    const files = filesQuery.data || [];
    return (
        <FileLinkingComponent
            values={props.rowData.linked_files}
            options={files.map(file => ({ title: file, inputValue: file }))}
            onEdit={(newValue: string[]) => props.onChange(newValue)}
            disableTooltip
        />
    );
};

const linkedFileSort = (a: { linked_files: string[] }, b: { linked_files: string[] }) =>
    a.linked_files.length - b.linked_files.length;

const RenderDatePicker = (rowData: Dataset) => <DateTimeText datetime={rowData.updated} />;

const RenderLinkedFilesButton = (props: Dataset) => (
    <LinkedFilesButton fileNames={props.linked_files} />
);

const RenderNotes = (rowData: Dataset) => <Note>{rowData.notes}</Note>;

export default function DatasetTable() {
    const classes = useStyles();
    const { user: currentUser } = useUserContext();
    const queryClient = useQueryClient();
    const [showRunner, setRunner] = useState(false);
    const [selectedDatasets, setSelectedDatasets] = useState<Dataset[]>([]);

    const dataFetch = useDatasetsPage();
    const datasetUpdateMutation = useDatasetUpdateMutation();
    const enumsQuery = useEnumsQuery();
    const enums = enumsQuery.data;
    const metadatasetTypesQuery = useMetadatasetTypesQuery();
    const metadatasetTypes = metadatasetTypesQuery.data;
    const datasetTypes = useMemo(
        () => metadatasetTypes && toKeyValue(Object.values(metadatasetTypes).flat()),
        [metadatasetTypes]
    );
    const tissueSampleTypes = useMemo(() => enums && toKeyValue(enums.TissueSampleType), [enums]);
    const conditions = useMemo(() => enums && toKeyValue(enums.DatasetCondition), [enums]);

    const filesQuery = useUnlinkedFilesQuery();
    const files = filesQuery.data || [];

    const [showInfo, setShowInfo] = useState(false);
    const [infoDataset, setInfoDataset] = useState<Dataset>();

    const { enqueueSnackbar } = useSnackbar();

    const { id: paramID } = useParams<{ id?: string }>();

    const downloadCsv = useDownloadCsv(GET_DATASETS_URL);

    const exportCsv = () => {
        downloadCsv(transformMTQueryToCsvDownloadParams(MTRef.current?.state.query || {}));
    };

    const { handleFilterChanged, setInitialFilters } = useTableFilterCache<Dataset>(
        "datasetTableFilterCache"
    );

    const columns = useMemo(() => {
        const columns: Column<Dataset>[] = [
            { title: "Family", field: "family_codename", editable: "never" },
            { title: "Participant", field: "participant_codename", editable: "never" },
            {
                title: "Tissue Sample",
                field: "tissue_sample_type",
                editable: "never",
                lookup: tissueSampleTypes,
            },
            {
                title: "Type",
                field: "dataset_type",
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
                render: RenderNotes,
                editComponent: EditNotes,
            },
            {
                title: "Files",
                field: "linked_files",
                // can search by number of files, or by file name
                customFilterAndSearch: customFileFilterAndSearch,
                customSort: linkedFileSort,
                render: RenderLinkedFilesButton,
                editComponent: EditFilesComponent,
            },
            {
                title: "Updated",
                field: "updated",
                type: "string",
                editable: "never",
                render: RenderDatePicker,
                filterComponent: DateFilterComponent,
            },
            { title: "Updated By", field: "updated_by", editable: "never" },
            {
                title: "ID",
                field: "dataset_id",
                editable: "never",
                defaultFilter: paramID,
            },
        ];

        setInitialFilters(columns);
        return columns;
    }, [conditions, datasetTypes, paramID, tissueSampleTypes, setInitialFilters]);

    //setting to `any` b/c MTable typing doesn't include dataManager
    const MTRef = useRef<any>();

    const cacheDeps = [enumsQuery.isFetched, metadatasetTypesQuery.isFetched, filesQuery.isFetched];

    const handleColumnDrag = useColumnOrderCache(MTRef, "datasetTableColumnOrder", cacheDeps);
    const handleSortChange = useSortOrderCache(MTRef, "datasetTableSortOrder", cacheDeps);

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
            <MaterialTablePrimary
                title="Datasets"
                tableRef={MTRef}
                columns={columns}
                data={query => {
                    if (query) handleFilterChanged(query.filters);
                    return dataFetch(query);
                }}
                options={{
                    selection: true,
                    exportMenu: [
                        {
                            label: "Export as CSV",
                            exportFunc: exportCsv,
                        },
                    ],
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
                                            onClick={() =>
                                                updateTableFilter(
                                                    MTRef,
                                                    "dataset_type",
                                                    datasetTypes
                                                )
                                            }
                                            clickable
                                            className={classes.chip}
                                        />
                                    ))}
                                <IconButton
                                    onClick={() => updateTableFilter(MTRef, "dataset_type", "")}
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
                onColumnDragged={handleColumnDrag}
                onOrderChange={handleSortChange}
            />
        </div>
    );
}
