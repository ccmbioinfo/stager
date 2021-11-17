import { useMemo, useRef, useState } from "react";
import { Column, EditComponentProps, MTableToolbar } from "@material-table/core";
import { Chip, IconButton, makeStyles } from "@material-ui/core";
import { Cancel, Delete, PlayArrow, Refresh, Visibility } from "@material-ui/icons";
import { useSnackbar } from "notistack";
import { useQueryClient } from "react-query";
import { useParams } from "react-router-dom";
import {
    ChipGroup,
    ConfirmModal,
    DateFilterComponent,
    DateTimeText,
    EditNotes,
    ExactMatchFilterToggle,
    FileLinkingComponent,
    MaterialTablePrimary,
    Note,
} from "../../components";
import { useUserContext } from "../../contexts";
import { resetAllTableFilters, rowDiff, toKeyValue, updateTableFilter } from "../../functions";
import {
    GET_DATASETS_URL,
    useColumnOrderCache,
    useDatasetDeleteMutation,
    useDatasetsPage,
    useDatasetUpdateMutation,
    useDownloadCsv,
    useEnumsQuery,
    useErrorSnackbar,
    useHiddenColumnCache,
    useMetadatasetTypesQuery,
    useSortOrderCache,
    useUnlinkedFilesQuery,
} from "../../hooks";
import { transformMTQueryToCsvDownloadParams } from "../../hooks/utils";
import { Dataset, DatasetDetailed, isRNASeqDataset, LinkedFile } from "../../typings";
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

const customFileFilterAndSearch = (filter: string, rowData: DatasetDetailed) => {
    return (
        filter === "" + rowData.linked_files.length ||
        rowData.linked_files.some(f => f.path.includes(filter))
    );
};

const EditFilesComponent = (props: EditComponentProps<DatasetDetailed>) => {
    const filesQuery = useUnlinkedFilesQuery();
    const files = filesQuery.data || [];
    return (
        <FileLinkingComponent
            values={props.rowData.linked_files}
            options={files}
            onEdit={newValue => props.onChange(newValue)}
            disableTooltip
        />
    );
};

const linkedFileSort = (a: { linked_files: LinkedFile[] }, b: { linked_files: LinkedFile[] }) =>
    a.linked_files.length - b.linked_files.length;

const RenderDatePicker = (rowData: Dataset) => <DateTimeText datetime={rowData.updated} />;

const RenderLinkedFilesButton = (props: Dataset) => (
    <LinkedFilesButton fileNames={(props.linked_files || []).map(f => f.path)} />
);

const RenderNotes = (rowData: Dataset) => <Note>{rowData.notes}</Note>;

export default function DatasetTable() {
    const classes = useStyles();
    const { user: currentUser } = useUserContext();
    const queryClient = useQueryClient();
    const [showRunner, setRunner] = useState(false);
    const [showModalLoading, setModalLoading] = useState(false);
    const [selectedDatasets, setSelectedDatasets] = useState<Dataset[]>([]);

    const dataFetch = useDatasetsPage();
    const datasetUpdateMutation = useDatasetUpdateMutation();
    const datasetDeleteMutation = useDatasetDeleteMutation();
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
    const enqueueErrorSnackbar = useErrorSnackbar();

    const { id: paramID } = useParams<{ id?: string }>();

    const downloadCsv = useDownloadCsv(GET_DATASETS_URL);

    const [confirmDelete, setConfirmDelete] = useState(false);

    const exportCsv = () =>
        downloadCsv(transformMTQueryToCsvDownloadParams(MTRef.current?.state.query || {}));

    //setting to `any` b/c MTable typing doesn't include dataManager
    const MTRef = useRef<any>();

    const cacheDeps = [enumsQuery.isFetched, metadatasetTypesQuery.isFetched, filesQuery.isFetched];

    const handleColumnDrag = useColumnOrderCache(MTRef, "datasetTableColumnOrder", cacheDeps);

    const { handleChangeColumnHidden, setHiddenColumns } = useHiddenColumnCache<DatasetDetailed>(
        "datasetTableDefaultHidden"
    );
    const { handleOrderChange, setInitialSorting } = useSortOrderCache<DatasetDetailed>(
        MTRef,
        "datasetTableSortOrder"
    );

    const columns = useMemo(() => {
        const columns: Column<DatasetDetailed>[] = [
            {
                title: "Family",
                field: "family_codename",
                editable: "never",
                filterComponent: props => <ExactMatchFilterToggle MTRef={MTRef} {...props} />,
            },
            {
                title: "Participant",
                field: "participant_codename",
                editable: "never",
                filterComponent: props => <ExactMatchFilterToggle MTRef={MTRef} {...props} />,
            },
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
                editable: (columnDef, row) => (row.analyses.length > 0 ? false : true),
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
                sorting: false,
                filtering: true,
            },
            {
                title: "Updated",
                field: "updated",
                type: "string",
                editable: "never",
                render: RenderDatePicker,
                filterComponent: DateFilterComponent,
                defaultSort: "desc",
            },
            { title: "Updated By", field: "updated_by", editable: "never" },
            {
                title: "ID",
                field: "dataset_id",
                editable: "never",
                defaultFilter: paramID,
            },
            {
                title: "Candidate Genes",
                field: "candidate_genes",
                editable: "never",
                sorting: false,
                render: row => (isRNASeqDataset(row) ? <Note>{row.candidate_genes}</Note> : "N/A"),
            },
            {
                title: "VCF Available",
                field: "vcf_available",
                editable: "never",
                sorting: false,
                filtering: false,
                render: row => (isRNASeqDataset(row) ? (row.vcf_available ? "Yes" : "No") : "N/A"),
            },
            {
                title: "Sequencing ID",
                field: "sequencing_id",
            },
        ];
        if (currentUser.is_admin || currentUser.groups.length > 1) {
            columns.push({
                title: "Permission Groups",
                field: "group_code",
                editable: "never",
                sorting: false,
                render: rowData => (
                    <ChipGroup
                        names={rowData.group_code?.map(c => c.toUpperCase()) || []}
                        size="small"
                    />
                ),
            });
        }

        setInitialSorting(columns);
        setHiddenColumns(columns);
        return columns;
    }, [
        conditions,
        currentUser,
        datasetTypes,
        paramID,
        tissueSampleTypes,
        setInitialSorting,
        setHiddenColumns,
    ]);

    return (
        <div>
            <AnalysisRunnerDialog
                datasets={selectedDatasets}
                open={showRunner}
                onClose={() => setRunner(false)}
            />
            {infoDataset && (
                <DatasetInfoDialog
                    dataset_id={infoDataset.dataset_id}
                    open={showInfo}
                    onClose={() => {
                        setShowInfo(false);
                    }}
                />
            )}
            <ConfirmModal
                id="confirm-modal-delete"
                open={confirmDelete}
                loading={showModalLoading}
                onClose={() => {
                    setConfirmDelete(false);
                    setModalLoading(false);
                }}
                onConfirm={() => {
                    setModalLoading(true);
                    const sampleString = selectedDatasets
                        .map(
                            dataset =>
                                `${dataset.participant_codename}/${dataset.tissue_sample_type}/${dataset.dataset_type}`
                        )
                        .join(", ");

                    selectedDatasets.forEach(row => {
                        datasetDeleteMutation.mutate(row.dataset_id, {
                            onSuccess: () => {
                                //refresh data
                                MTRef.current.onQueryChange();
                                enqueueSnackbar(`${sampleString} deleted successfully.`, {
                                    variant: "success",
                                });
                                setConfirmDelete(false);
                                setModalLoading(false);
                            },
                            onError: error => {
                                enqueueErrorSnackbar(error);
                                setConfirmDelete(false);
                                setModalLoading(false);
                            },
                        });
                    });
                }}
                title="Delete dataset"
                colors={{ cancel: "secondary" }}
            >
                Are you sure you want to delete dataset{" "}
                {selectedDatasets.map(d => d.dataset_id).join(", ")}?
            </ConfirmModal>

            <MaterialTablePrimary
                title="Datasets"
                tableRef={MTRef}
                columns={columns}
                data={dataFetch}
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
                                            file =>
                                                !receivedDataset.linked_files
                                                    .map(f => f.path)
                                                    .includes(file.path)
                                        );
                                        //refresh data
                                        MTRef.current.onQueryChange();

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
                                        enqueueErrorSnackbar(
                                            response,
                                            `Failed to edit Dataset ID ${oldDataset?.dataset_id}`
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
                                    Object.entries(metadatasetTypes).map(
                                        ([metatype, datasetTypes]) => (
                                            <Chip
                                                key={metatype}
                                                label={metatype}
                                                onClick={() => {
                                                    updateTableFilter(
                                                        MTRef,
                                                        "dataset_type",
                                                        datasetTypes
                                                    );
                                                }}
                                                clickable
                                                className={classes.chip}
                                            />
                                        )
                                    )}
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
                        tooltip: "Clear All Filters",
                        icon: Refresh,
                        position: "toolbar",
                        onClick: () => resetAllTableFilters(MTRef),
                    },
                    {
                        tooltip: "Delete selected datasets",
                        icon: Delete,
                        hidden: !currentUser.is_admin,
                        position: "toolbarOnSelect",
                        onClick: (evt, data) => {
                            setSelectedDatasets(data as Dataset[]);
                            setConfirmDelete(true);
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
                onChangeColumnHidden={handleChangeColumnHidden}
                onOrderChange={handleOrderChange}
            />
        </div>
    );
}
