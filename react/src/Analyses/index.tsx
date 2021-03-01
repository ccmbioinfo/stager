import React, { useEffect, useMemo, useState } from "react";
import { useHistory, useParams } from "react-router";
import { makeStyles } from "@material-ui/core/styles";
import { Chip, IconButton, TextField, Container } from "@material-ui/core";
import {
    Cancel,
    Add,
    Visibility,
    PlayArrow,
    PersonPin,
    AssignmentTurnedIn,
    Error,
} from "@material-ui/icons";
import MaterialTable, { MTableToolbar } from "material-table";
import { useSnackbar } from "notistack";
import { UseMutationResult } from "react-query";
import { isRowSelected, exportCSV, jsonToAnalyses } from "../functions";
import { Analysis, PipelineStatus } from "../typings";
import { AnalysisInfoDialog, Note, DateTimeText, DateFilterComponent } from "../components";
import { AnalysisOptions, useAnalysesQuery, useAnalysisUpdateMutation } from "../hooks";
import CancelAnalysisDialog from "./components/CancelAnalysisDialog";
import AddAnalysisAlert from "./components/AddAnalysisAlert";
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
    chip: {
        color: "primary",
        marginRight: "10px",
        colorPrimary: theme.palette.primary,
    },
}));

function pipeName(row: Analysis) {
    if (row.pipeline) {
        return `${row.pipeline.pipeline_name} ${row.pipeline.pipeline_version}`;
    } else {
        return "";
    }
}

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
 * Returns whether this row can be completed.
 */
function completeFilter(row: Analysis) {
    return row.analysis_state === PipelineStatus.RUNNING;
}

/**
 * Returns whether it's possible for this row to error.
 */
function errorFilter(row: Analysis) {
    return (
        row.analysis_state === PipelineStatus.RUNNING ||
        row.analysis_state === PipelineStatus.PENDING
    );
}

/**
 * Returns whether this analysis is allowed to be cancelled.
 */
function cancelFilter(row: Analysis) {
    return (
        row.analysis_state === PipelineStatus.RUNNING ||
        row.analysis_state === PipelineStatus.PENDING
    );
}

/**
 * Returns whether this analysis is allowed to be run.
 */
function runFilter(row: Analysis) {
    return row.analysis_state === PipelineStatus.PENDING;
}

/**
 * Updates the state of all selected rows.
 * Returns a new list of Analyses, as well as the number of rows that changed, were skipped, or failed to change.
 * TODO: Revisit after overfetch #283
 *
 * @param selectedRows
 * @param filter A function which returns true for a row that is allowed to be changed to newState, false otherwise.
 * @param mutation The mutation object to use to update the analyses.
 * @param newState The new state to apply to rows which pass the filter.
 */
async function _changeStateForSelectedRows(
    selectedRows: Analysis[],
    filter: (row: Analysis) => boolean,
    mutation: UseMutationResult<Analysis, Response, AnalysisOptions>,
    newState: PipelineStatus
) {
    let changed = 0;
    let skipped = 0;
    let failed = 0;
    for (let i = 0; i < selectedRows.length; i++) {
        let row = selectedRows[i];
        if (filter(row)) {
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

export default function Analyses() {
    const classes = useStyles();
    const [detail, setDetail] = useState(false); // for detail dialog
    const [cancel, setCancel] = useState(false); // for cancel dialog
    const [direct, setDirect] = useState(false); // for add analysis dialog (re-direct)
    const [assignment, setAssignment] = useState(false); // for set assignee dialog

    const analysesQuery = useAnalysesQuery();
    const analyses = useMemo(
        () => (analysesQuery.isSuccess ? jsonToAnalyses(analysesQuery.data) : []),
        [analysesQuery]
    );
    const analysisUpdateMutation = useAnalysisUpdateMutation();

    const [activeRows, setActiveRows] = useState<Analysis[]>([]);

    const [chipFilter, setChipFilter] = useState<string>(""); // filter by state

    const history = useHistory();

    const { enqueueSnackbar } = useSnackbar();
    const { id: paramID } = useParams<{ id: string }>();

    function changeAnalysisState(filter: (row: Analysis) => boolean, newState: PipelineStatus) {
        return _changeStateForSelectedRows(activeRows, filter, analysisUpdateMutation, newState);
    }

    useEffect(() => {
        document.title = `Analyses | ${process.env.REACT_APP_NAME}`;
    }, []);

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
                        changeAnalysisState(cancelFilter, PipelineStatus.CANCELLED).then(
                            ({ changed, skipped, failed }) => {
                                setCancel(false);
                                if (changed > 0)
                                    enqueueSnackbar(
                                        `${changed} ${
                                            changed !== 1 ? "analyses" : "analysis"
                                        } cancelled successfully`,
                                        { variant: "success" }
                                    );
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
                            }
                        );
                    }}
                    cancelFilter={cancelFilter}
                    labeledByPrefix={`${rowsToString(activeRows, "-")}`}
                    describedByPrefix={`${rowsToString(activeRows, "-")}`}
                />
            )}

            {activeRows.length > 0 && (
                <AnalysisInfoDialog
                    open={detail}
                    analysis={activeRows[0]}
                    onClose={() => {
                        setDetail(false);
                    }}
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
                <MaterialTable
                    columns={[
                        {
                            title: "Analysis ID",
                            field: "analysis_id",
                            type: "string",
                            editable: "never",
                            width: "8%",
                            defaultFilter: paramID,
                        },
                        {
                            title: "Pipeline",
                            field: "pipeline_name",
                            type: "string",
                            width: "8%",
                            editable: "never",
                            render: (row, type) => pipeName(row),
                            customFilterAndSearch: (term: string, row) =>
                                pipeName(row).toLowerCase().includes(term.toLowerCase()),
                        },
                        {
                            title: "Assignee",
                            field: "assignee",
                            type: "string",
                            editable: "never",
                            width: "8%",
                        },
                        {
                            title: "Requester",
                            field: "requester",
                            type: "string",
                            editable: "never",
                            width: "8%",
                        },
                        {
                            title: "Updated",
                            field: "updated",
                            type: "string",
                            editable: "never",
                            render: rowData => <DateTimeText datetime={rowData.updated} />,
                            filterComponent: props => <DateFilterComponent {...props} />,
                        },
                        {
                            title: "Path Prefix",
                            field: "result_path",
                            type: "string",
                        },
                        {
                            title: "Status",
                            field: "analysis_state",
                            type: "string",
                            editable: "never",
                            defaultFilter: chipFilter,
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
                    ]}
                    isLoading={analysisUpdateMutation.isLoading}
                    data={analyses || []}
                    title="Analyses"
                    options={{
                        pageSize: 10,
                        filtering: true,
                        search: false,
                        padding: "dense",
                        selection: true,
                        exportAllData: true,
                        exportButton: { csv: true, pdf: false },
                        exportCsv: (columns, data) => exportCSV(columns, data, "Analyses"),
                    }}
                    actions={[
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
                            icon: Cancel,
                            tooltip: "Cancel analysis",
                            position: "toolbarOnSelect",
                            onClick: (event, rowData) => {
                                setActiveRows(rowData as Analysis[]);
                                setCancel(true);
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
                            icon: PlayArrow,
                            tooltip: "Run analysis",
                            position: "toolbarOnSelect",
                            onClick: (event, rowData) => {
                                setActiveRows(rowData as Analysis[]);
                                changeAnalysisState(runFilter, PipelineStatus.RUNNING).then(
                                    ({ changed, skipped, failed }) => {
                                        if (changed > 0)
                                            enqueueSnackbar(
                                                `${changed} ${
                                                    changed !== 1 ? "analyses" : "analysis"
                                                } started successfully`,
                                                { variant: "success" }
                                            );
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
                                    }
                                );
                            },
                        },
                        {
                            icon: AssignmentTurnedIn,
                            tooltip: "Complete analysis",
                            position: "toolbarOnSelect",
                            onClick: (event, rowData) => {
                                setActiveRows(rowData as Analysis[]);
                                changeAnalysisState(completeFilter, PipelineStatus.COMPLETED).then(
                                    ({ changed, skipped, failed }) => {
                                        if (changed > 0)
                                            enqueueSnackbar(
                                                `${changed} ${
                                                    changed !== 1 ? "analyses" : "analysis"
                                                } completed successfully`,
                                                { variant: "success" }
                                            );
                                        if (skipped > 0)
                                            enqueueSnackbar(
                                                `${skipped} ${
                                                    skipped !== 1 ? "analyses" : "analysis"
                                                } ${
                                                    skipped !== 1 ? "were" : "was"
                                                } not running, and ${
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
                                    }
                                );
                            },
                        },
                        {
                            icon: Error,
                            tooltip: "Error analysis",
                            position: "toolbarOnSelect",
                            onClick: (event, rowData) => {
                                setActiveRows(rowData as Analysis[]);
                                changeAnalysisState(errorFilter, PipelineStatus.ERROR).then(
                                    ({ changed, skipped, failed }) => {
                                        if (changed > 0)
                                            enqueueSnackbar(
                                                `${changed} ${
                                                    changed !== 1 ? "analyses" : "analysis"
                                                } errored successfully`,
                                                { variant: "success" }
                                            );
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
                                    }
                                );
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
                                    onSuccess: newRow => {
                                        enqueueSnackbar(
                                            `Analysis ID ${oldData?.analysis_id} edited successfully`,
                                            { variant: "success" }
                                        );
                                    },
                                    onError: response => {
                                        enqueueSnackbar(
                                            `Failed to edit Analysis ID ${oldData?.analysis_id} - ${response.status} ${response.statusText}`,
                                            { variant: "error" }
                                        );
                                        console.error(response);
                                    },
                                }
                            );
                        },
                    }}
                    components={{
                        Toolbar: props => (
                            <div>
                                <MTableToolbar {...props} />
                                <div style={{ marginLeft: "24px" }}>
                                    <Chip
                                        label="Completed"
                                        clickable
                                        className={classes.chip}
                                        onClick={() => setChipFilter(PipelineStatus.COMPLETED)}
                                    />
                                    <Chip
                                        label="Running"
                                        clickable
                                        className={classes.chip}
                                        onClick={() => setChipFilter(PipelineStatus.RUNNING)}
                                    />
                                    <Chip
                                        label="Pending"
                                        clickable
                                        className={classes.chip}
                                        onClick={() => setChipFilter(PipelineStatus.PENDING)}
                                    />
                                    <Chip
                                        label="Error"
                                        clickable
                                        className={classes.chip}
                                        onClick={() => setChipFilter(PipelineStatus.ERROR)}
                                    />
                                    <Chip
                                        label="Cancelled"
                                        clickable
                                        className={classes.chip}
                                        onClick={() => setChipFilter(PipelineStatus.CANCELLED)}
                                    />
                                    <IconButton onClick={() => setChipFilter("")}>
                                        <Cancel />
                                    </IconButton>
                                </div>
                            </div>
                        ),
                    }}
                    localization={{
                        header: {
                            actions: "", //remove action buttons' header
                        },
                    }}
                />
            </Container>
        </main>
    );
}
