import React, { useEffect, useMemo, useRef, useState } from "react";
import { Column } from "@material-table/core";
import { Container, MenuItem, Select, TextField, useTheme } from "@material-ui/core";
import { makeStyles, Theme } from "@material-ui/core/styles";
import {
    Add,
    AssignmentTurnedIn,
    Cancel,
    Delete,
    Error,
    Info,
    PersonPin,
    PlayArrow,
    Refresh,
    Visibility,
} from "@material-ui/icons";
import { useSnackbar } from "notistack";
import { UseMutationResult } from "react-query";
import { useHistory, useParams } from "react-router";
import {
    AnalysisInfoDialog,
    ChipGroup,
    ConfirmModal,
    DateFilterComponent,
    DateTimeText,
    MaterialTablePrimary,
    Note,
} from "../components";
import { useAPIInfoContext, useUserContext } from "../contexts";
import {
    checkPipelineStatusChange,
    isRowSelected,
    resetAllTableFilters,
    toKeyValue,
} from "../functions";
import {
    AnalysisOptions,
    GET_ANALYSES_URL,
    useAnalysesPage,
    useAnalysisDeleteMutation,
    useAnalysisUpdateMutation,
    useColumnOrderCache,
    useDownloadCsv,
    useErrorSnackbar,
    useHiddenColumnCache,
    useSortOrderCache,
} from "../hooks";
import { transformMTQueryToCsvDownloadParams } from "../hooks/utils";
import { Analysis, AnalysisPriority, PipelineStatus } from "../typings";
import AddAnalysisAlert from "./components/AddAnalysisAlert";
import AnalysisNotes from "./components/AnalysisNotes";
import CancelAnalysisDialog from "./components/CancelAnalysisDialog";
import SelectPipelineStatus from "./components/SelectPipelineStatus";
import SetAssigneeDialog from "./components/SetAssigneeDialog";

const useStyles = makeStyles(theme => ({
    appBarSpacer: theme.mixins.toolbar,
    content: {
        flexGrow: 1,
        height: "100vh",
        overflow: "auto",
    },
    container: {
        paddingTop: theme.spacing(3),
        paddingBottom: theme.spacing(3),
    },
}));

// Returns the analysis IDs of the provided rows, optionally delimited with delim
function rowsToString(rows: Analysis[], delim?: string) {
    let returnStr = "";
    if (delim) {
        rows.forEach(row => (returnStr = returnStr.concat(`${row.analysis_id}${delim}`)));
    } else {
        rows.forEach(
            (row, index, arr) =>
                (returnStr = returnStr.concat(
                    index < arr.length - 1 ? `${row.analysis_id}, ` : `${row.analysis_id}`
                ))
        );
    }
    return returnStr;
}

/**
 * Updates the state of all selected rows.
 * Returns a new list of Analyses, as well as the number of rows that changed, were skipped, or failed to change.
 *
 * @param selectedRows
 * @param mutation The mutation object to use to update the analyses.
 * @param newState The new state to apply to rows which pass the filter.
 */
async function _changeStateForSelectedRows(
    selectedRows: Analysis[],
    mutation: UseMutationResult<Analysis, Response, AnalysisOptions>,
    newState: PipelineStatus
) {
    let changed = 0;
    let skipped = 0;
    let failed = 0;
    for (let i = 0; i < selectedRows.length; i++) {
        let row = selectedRows[i];
        if (checkPipelineStatusChange(row.analysis_state, newState)) {
            try {
                await mutation.mutateAsync({
                    analysis_id: row.analysis_id,
                    analysis_state: newState,
                    source: "selection",
                });
                changed++;
            } catch (res) {
                failed++;
                console.error(res);
            }
        } else if (isRowSelected(row)) {
            skipped++;
        }
    }
    return { changed, skipped, failed };
}

const getHighlightColor = (theme: Theme, priority: AnalysisPriority, status: PipelineStatus) => {
    const statusRelevant = [PipelineStatus.PENDING, PipelineStatus.RUNNING].includes(status);

    if (statusRelevant && priority === "Research") {
        return { backgroundColor: theme.palette.warning.light };
    }
    if (statusRelevant && priority === "Clinical") {
        return { backgroundColor: theme.palette.error.light };
    }
    return {};
};

export default function Analyses() {
    const classes = useStyles();
    const { user: currentUser } = useUserContext(); //for user details
    const [detail, setDetail] = useState(false); // for detail dialog
    const [cancel, setCancel] = useState(false); // for cancel dialog
    const [direct, setDirect] = useState(false); // for add analysis dialog (re-direct)
    const [assignment, setAssignment] = useState(false); // for set assignee dialog
    const [comments, setComments] = useState(false); // for comments/ notes from associated participants and datasets

    const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(null); // anchor element for notes popover

    const dataFetch = useAnalysesPage();

    const downloadCsv = useDownloadCsv(GET_ANALYSES_URL);

    const analysisUpdateMutation = useAnalysisUpdateMutation();
    const analysisDeleteMutation = useAnalysisDeleteMutation();

    const theme = useTheme();

    const apiInfo = useAPIInfoContext() ?? undefined;
    const kindLookup = useMemo(
        () =>
            apiInfo &&
            toKeyValue(
                [...new Set(Object.values(apiInfo.dataset_types).map(e => e.kind))].sort(
                    ([a], [b]) => a.localeCompare(b)
                )
            ),
        [apiInfo]
    );
    const priorityLookup = useMemo(
        () => apiInfo && toKeyValue(apiInfo.enums.PriorityType),
        [apiInfo]
    );
    const pipelineStatusLookup = useMemo(() => toKeyValue(Object.values(PipelineStatus)), []);

    const [activeRows, setActiveRows] = useState<Analysis[]>([]);
    const [confirmDelete, setConfirmDelete] = useState<boolean>(false);
    const [showModalLoading, setModalLoading] = useState(false);

    const history = useHistory();

    const { enqueueSnackbar } = useSnackbar();
    const enqueueErrorSnackbar = useErrorSnackbar();
    const { id: paramID } = useParams<{ id: string }>();

    const tableRef = useRef<any>();
    useEffect(() => {
        document.title = `Analyses | ${process.env.REACT_APP_NAME}`;
    }, []);

    const handleColumnDrag = useColumnOrderCache(tableRef, "analysisTableColumnOrder", [!!apiInfo]);

    const { handleChangeColumnHidden, setHiddenColumns } = useHiddenColumnCache<Analysis>(
        "analysisTableDefaultHidden"
    );
    const { handleOrderChange, setInitialSorting } = useSortOrderCache<Analysis>(
        tableRef,
        "analysisTableSortOrder"
    );

    const handleAnalysisDelete = () => {
        setActiveRows([]);
        setConfirmDelete(false);
        setModalLoading(false);
    };

    function changeAnalysisState(newState: PipelineStatus, rows = activeRows) {
        return _changeStateForSelectedRows(rows, analysisUpdateMutation, newState);
    }

    const exportCsv = () => {
        downloadCsv(transformMTQueryToCsvDownloadParams(tableRef.current?.state.query || {}));
    };

    const columns = useMemo(() => {
        const columns: Column<Analysis>[] = [
            {
                title: "Kind",
                field: "kind",
                type: "string",
                editable: "never",
                lookup: kindLookup,
            },
            {
                title: "Status",
                field: "analysis_state",
                type: "string",
                lookup: pipelineStatusLookup,
                editComponent: SelectPipelineStatus,
            },
            {
                title: "Priority",
                field: "priority",
                type: "string",
                lookup: priorityLookup,
                editComponent: ({ onChange, value }) => {
                    return (
                        <Select
                            value={value || "None"}
                            onChange={event =>
                                onChange(event.target.value === "None" ? null : event.target.value)
                            }
                            fullWidth
                        >
                            {apiInfo?.enums.PriorityType.map(p => (
                                <MenuItem key={p} value={p}>
                                    {p}
                                </MenuItem>
                            ))}
                            <MenuItem value="None">None</MenuItem>
                        </Select>
                    );
                },
            },
            {
                title: "Requester",
                field: "requester",
                type: "string",
                editable: "never",
            },
            {
                title: "Assignee",
                field: "assignee",
                type: "string",
                editable: "always",
            },
            {
                title: "Requested",
                field: "requested",
                type: "string",
                editable: "never",
                render: rowData => <DateTimeText datetime={rowData.requested} />,
                filterComponent: DateFilterComponent,
                defaultSort: "desc",
            },
            {
                title: "Family Codename(s)",
                field: "family_codename",
                render: rowData => (
                    <ChipGroup
                        display="flex"
                        flexDirection="column"
                        alignItems="flex-start"
                        names={rowData.family_codenames?.filter((c, i, a) => a.indexOf(c) === i)}
                    />
                ),
                sorting: false,
            },
            {
                title: "Participant Codename(s)",
                field: "participant_codename",
                render: rowData => (
                    <ChipGroup
                        display="flex"
                        flexDirection="column"
                        alignItems="flex-start"
                        names={rowData.participant_codenames}
                    />
                ),
                sorting: false,
            },
            {
                title: "Updated",
                field: "updated",
                type: "string",
                editable: "never",
                render: rowData => <DateTimeText datetime={rowData.updated} />,
                filterComponent: DateFilterComponent,
            },
            {
                title: "Path Prefix",
                field: "result_path",
                type: "string",
                render: rowData => <Note>{rowData.result_path}</Note>,
            },
            {
                title: "Notes",
                field: "notes",
                type: "string",
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
                title: "ID",
                field: "analysis_id",
                type: "string",
                editable: "never",
                defaultFilter: paramID,
            },
        ];
        setHiddenColumns(columns);
        setInitialSorting(columns);
        return columns;
    }, [
        apiInfo,
        paramID,
        kindLookup,
        pipelineStatusLookup,
        priorityLookup,
        setHiddenColumns,
        setInitialSorting,
    ]);

    return (
        <main className={classes.content}>
            <div className={classes.appBarSpacer} />
            {activeRows.length > 0 && (
                <CancelAnalysisDialog
                    open={cancel}
                    affectedRows={activeRows}
                    title={activeRows.length === 1 ? `Stop Analysis?` : `Stop Analyses?`}
                    onClose={() => {
                        setCancel(false);
                    }}
                    onAccept={() => {
                        changeAnalysisState(PipelineStatus.CANCELLED).then(
                            ({ changed, skipped, failed }) => {
                                if (changed > 0)
                                    enqueueSnackbar(
                                        `${changed} ${
                                            changed !== 1 ? "analyses" : "analysis"
                                        } cancelled successfully`,
                                        { variant: "success" }
                                    );
                                tableRef.current.onQueryChange();
                                if (skipped > 0)
                                    enqueueSnackbar(
                                        `${skipped} ${
                                            skipped !== 1 ? "analyses were" : "analysis was"
                                        } not running, and ${
                                            skipped !== 1 ? "were" : "was"
                                        } skipped`
                                    );
                                if (failed > 0)
                                    enqueueSnackbar(
                                        `Failed to cancel ${failed} ${
                                            failed !== 1 ? "analyses" : "analysis"
                                        }`,
                                        { variant: "error" }
                                    );
                                setCancel(false);
                                tableRef.current.onQueryChange();
                            }
                        );
                    }}
                    labeledByPrefix={`${rowsToString(activeRows, "-")}`}
                    describedByPrefix={`${rowsToString(activeRows, "-")}`}
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
                    activeRows.forEach(row => {
                        analysisDeleteMutation.mutate(row.analysis_id, {
                            onSuccess: () => {
                                handleAnalysisDelete();
                                enqueueSnackbar(`Deleted successfully.`, {
                                    variant: "success",
                                });

                                //refresh data
                                tableRef.current.onQueryChange();
                            },
                            onError: error => {
                                handleAnalysisDelete();
                                enqueueErrorSnackbar(error);
                            },
                        });
                    });
                }}
                title="Delete analysis"
                colors={{ cancel: "secondary" }}
            >
                Are you sure you want to delete analysis{" "}
                {activeRows.map(analysis => analysis.analysis_id).join(", ")}?
            </ConfirmModal>

            {activeRows.length > 0 && (
                <AnalysisInfoDialog
                    open={detail}
                    analysis={activeRows[0]}
                    onClose={() => {
                        setDetail(false);
                    }}
                    refreshTable={tableRef.current.onQueryChange}
                />
            )}

            {activeRows.length > 0 && (
                <AnalysisNotes
                    open={comments}
                    anchorEl={anchorEl}
                    onClose={() => {
                        setAnchorEl(null);
                        setComments(false);
                    }}
                    analysis={activeRows[0]}
                />
            )}

            <AddAnalysisAlert
                open={direct}
                onClose={() => {
                    setDirect(false);
                }}
                onAccept={() => {
                    setDirect(false);
                    history.push("/datasets");
                }}
            />

            {activeRows.length > 0 && (
                <SetAssigneeDialog
                    affectedRows={activeRows}
                    open={assignment}
                    onClose={() => {
                        setAssignment(false);
                    }}
                    onSubmit={async username => {
                        let count = 0;
                        let failed = 0;
                        for (const row of activeRows) {
                            try {
                                await analysisUpdateMutation.mutateAsync({
                                    analysis_id: row.analysis_id,
                                    assignee: username,
                                });
                                count++;
                            } catch (res) {
                                failed++;
                                console.error(res);
                            }
                        }
                        setAssignment(false);
                        if (count > 0) {
                            enqueueSnackbar(
                                `${count} analyses successfully assigned to user '${username}'`,
                                { variant: "success" }
                            );
                            tableRef.current.onQueryChange();
                        }
                        if (failed > 0) {
                            enqueueSnackbar(
                                `${failed} analyses could not be assigned to '${username}'`,
                                { variant: "error" }
                            );
                        }
                    }}
                />
            )}

            <Container maxWidth={false} className={classes.container}>
                <MaterialTablePrimary
                    title="Analyses"
                    tableRef={tableRef}
                    columns={columns}
                    isLoading={analysisUpdateMutation.isLoading}
                    data={dataFetch}
                    options={{
                        rowStyle: data =>
                            getHighlightColor(theme, data.priority, data.analysis_state),
                        selection: true,
                        exportMenu: [
                            {
                                label: "Export as CSV",
                                exportFunc: exportCsv,
                            },
                        ],
                        search: true,
                    }}
                    actions={[
                        {
                            icon: Info,
                            tooltip: "View Comments",
                            position: "row",
                            onClick: (event, rowData) => {
                                setActiveRows([rowData as Analysis]);
                                setComments(true);
                                setAnchorEl(event.currentTarget);
                            },
                        },
                        {
                            icon: Visibility,
                            tooltip: "View analysis details",
                            position: "row",
                            onClick: (event, rowData) => {
                                // We can only view details of one row at a time
                                setActiveRows([rowData as Analysis]);
                                setDetail(true);
                            },
                        },
                        {
                            icon: Add,
                            tooltip: "Add New Analysis",
                            position: "toolbar",
                            isFreeAction: true,
                            onClick: () => setDirect(true),
                        },
                        {
                            tooltip: "Clear All Filters",
                            icon: Refresh,
                            position: "toolbar",
                            onClick: () => resetAllTableFilters(tableRef),
                        },
                        {
                            icon: Cancel,
                            tooltip: "Cancel analysis",
                            position: "toolbarOnSelect",
                            onClick: (event, rowData) => {
                                setActiveRows(rowData as Analysis[]);
                                setCancel(true);
                            },
                        },
                        {
                            icon: PlayArrow,
                            tooltip: "Run analysis",
                            position: "toolbarOnSelect",
                            onClick: (event, rowData) => {
                                changeAnalysisState(
                                    PipelineStatus.RUNNING,
                                    rowData as Analysis[]
                                ).then(({ changed, skipped, failed }) => {
                                    if (changed > 0)
                                        enqueueSnackbar(
                                            `${changed} ${
                                                changed !== 1 ? "analyses" : "analysis"
                                            } started successfully`,
                                            { variant: "success" }
                                        );
                                    tableRef.current.onQueryChange();
                                    if (skipped > 0)
                                        enqueueSnackbar(
                                            `${skipped} ${
                                                skipped !== 1 ? "analyses were" : "analysis was"
                                            } already queued or cancelled, and ${
                                                skipped !== 1 ? "were" : "was"
                                            } skipped`
                                        );
                                    if (failed > 0)
                                        enqueueSnackbar(
                                            `Failed to start ${failed} ${
                                                failed !== 1 ? "analyses" : "analysis"
                                            }`,
                                            { variant: "error" }
                                        );
                                });
                            },
                        },
                        {
                            icon: AssignmentTurnedIn,
                            tooltip: "Complete analysis",
                            position: "toolbarOnSelect",
                            onClick: (event, rowData) => {
                                changeAnalysisState(
                                    PipelineStatus.COMPLETED,
                                    rowData as Analysis[]
                                ).then(({ changed, skipped, failed }) => {
                                    if (changed > 0)
                                        enqueueSnackbar(
                                            `${changed} ${
                                                changed !== 1 ? "analyses" : "analysis"
                                            } completed successfully`,
                                            { variant: "success" }
                                        );
                                    tableRef.current.onQueryChange();
                                    if (skipped > 0)
                                        enqueueSnackbar(
                                            `${skipped} ${
                                                skipped !== 1 ? "analyses" : "analysis"
                                            } ${skipped !== 1 ? "were" : "was"} not running, and ${
                                                skipped !== 1 ? "were" : "was"
                                            } skipped`
                                        );
                                    if (failed > 0)
                                        enqueueSnackbar(
                                            `Failed to complete ${failed} ${
                                                failed !== 1 ? "analyses" : "analysis"
                                            }`,
                                            { variant: "error" }
                                        );
                                });
                            },
                        },
                        {
                            icon: Error,
                            tooltip: "Error analysis",
                            position: "toolbarOnSelect",
                            onClick: (event, rowData) => {
                                changeAnalysisState(
                                    PipelineStatus.ERROR,
                                    rowData as Analysis[]
                                ).then(({ changed, skipped, failed }) => {
                                    if (changed > 0)
                                        enqueueSnackbar(
                                            `${changed} ${
                                                changed !== 1 ? "analyses" : "analysis"
                                            } errored successfully`,
                                            { variant: "success" }
                                        );
                                    tableRef.current.onQueryChange();
                                    if (skipped > 0)
                                        enqueueSnackbar(
                                            `${skipped} ${
                                                skipped !== 1 ? "analyses" : "analysis"
                                            } ${
                                                skipped !== 1 ? "were" : "was"
                                            } not running or queued, and ${
                                                skipped !== 1 ? "were" : "was"
                                            } skipped`
                                        );
                                    if (failed > 0)
                                        enqueueSnackbar(
                                            `Failed to error ${failed} ${
                                                failed !== 1 ? "analyses" : "analysis"
                                            }`,
                                            { variant: "error" }
                                        );
                                });
                            },
                        },
                        {
                            icon: Delete,
                            tooltip: "Delete Analysis",
                            hidden: !currentUser.is_admin,
                            onClick: (event, rowData) => {
                                setActiveRows(rowData as Analysis[]);
                                setConfirmDelete(true);
                            },
                        },
                        {
                            icon: PersonPin,
                            tooltip: "Assign to...",
                            onClick: (event, rowData) => {
                                // Data handled by SetAssigneeDialog onSubmit
                                setActiveRows(rowData as Analysis[]);
                                setAssignment(true);
                            },
                        },
                    ]}
                    editable={{
                        onRowUpdate: async (newData, oldData) => {
                            analysisUpdateMutation.mutate(
                                { ...newData, source: "row-edit" },
                                {
                                    onSuccess: () => {
                                        enqueueSnackbar(
                                            `Analysis ID ${oldData?.analysis_id} edited successfully`,
                                            { variant: "success" }
                                        );
                                        //refresh data
                                        tableRef.current.onQueryChange();
                                    },
                                    onError: response => {
                                        enqueueErrorSnackbar(
                                            response,
                                            `Failed to edit Analysis ID ${oldData?.analysis_id}`
                                        );
                                        console.error(response);
                                    },
                                }
                            );
                        },
                    }}
                    onColumnDragged={handleColumnDrag}
                    onChangeColumnHidden={handleChangeColumnHidden}
                    onOrderChange={handleOrderChange}
                />
            </Container>
        </main>
    );
}
