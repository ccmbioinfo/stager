import React, { useEffect, useState } from 'react';
import { useParams, useHistory } from 'react-router';
import { makeStyles } from '@material-ui/core/styles';
import { Chip, IconButton, TextField, Container } from '@material-ui/core';
import { Cancel, Add, Visibility, PlayArrow, PersonPin } from '@material-ui/icons';
import MaterialTable, { MTableToolbar } from 'material-table';
import { useSnackbar } from 'notistack';
import Title from '../Title';
import CancelAnalysisDialog from './CancelAnalysisDialog';
import AnalysisInfoDialog from '../AnalysisInfoDialog';
import AddAnalysisAlert from './AddAnalysisAlert';
import SetAssigneeDialog from './SetAssigneeDialog';
import { emptyCellValue, formatDateString, Analysis, PipelineStatus, jsonToAnalyses } from '../utils';

const useStyles = makeStyles(theme => ({
    root: {
        display: 'fill',
    },
    appBarSpacer: theme.mixins.toolbar,
    content: {
        flexGrow: 1,
        height: '100vh',
        overflow: 'auto',
    },
    container: {
        paddingTop: theme.spacing(3),
        paddingBottom: theme.spacing(3),
    },
    paper: {
        padding: theme.spacing(2),
        display: 'flex',
        overflow: 'auto',
        flexDirection: 'column',
    },
    seeMore: {
        marginTop: theme.spacing(3),
    },
    dialogHeader: {
        paddingBottom: '0',
    },
    hoverIcon: {
        '&:hover': {
            background: "#f1f1f1",
        },
    },
    statusTitle: {
        color: '#3f51b5',
    },
    centreItem: {
        textAlign: 'center',
    },
    downloadButton: {
        marginTop: theme.spacing(3),
        float: "right",
    },
    viewIcon: {
        textAlign: 'center',
        '&:hover': {
            //color: '#3f51b5',
            background: "#f1f1f1",
        },
    },
    chip: {
        color: "primary",
        marginRight: '10px',
        colorPrimary: theme.palette.primary,
    }
}));

// Returns the analysis IDs of the provided rows, optionally delimited with delim
function rowsToString(rows: Analysis[], delim?: string) {
    let returnStr = "";
    if (delim) {
        rows.forEach((row) => returnStr = returnStr.concat(`${row.analysis_id}${delim}`));
    } else {
        rows.forEach((row, index, arr) => (
            returnStr = returnStr.concat(
            index < arr.length-1
            ? `${row.analysis_id}, `
            : `${row.analysis_id}`
        )));
    }
    return returnStr;
}

/**
 * Returns whether this analysis is allowed to be cancelled.
 */
function cancelFilter(row: Analysis) {
    return row.state === PipelineStatus.RUNNING || row.state === PipelineStatus.PENDING;
}

/**
 * Returns whether this analysis is allowed to be run.
 */
function runFilter(row: Analysis) {
    return row.state === PipelineStatus.ERROR || row.state === PipelineStatus.CANCELLED;
}

export default function Analyses() {
    const classes = useStyles();
    const [rows, setRows] = useState<Analysis[]>([]);
    const [detail, setDetail] = useState(false); // for detail dialog
    const [cancel, setCancel] = useState(false); // for cancel dialog
    const [direct, setDirect] = useState(false); // for add analysis dialog (re-direct)
    const [assignment, setAssignment] = useState(false); // for set assignee dialog

    const [activeRows, setActiveRows] = useState<Analysis[]>([]);

    const [chipFilter, setChipFilter] = useState<string>(""); // filter by state

    const history = useHistory();

    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    useEffect(() => {
        document.title = "Analyses | ST2020";

        // Fetch data here
        fetch('/api/analyses', { method: "GET" })
        .then(response => response.json())
        .then(data => {
            const rows = jsonToAnalyses(data);
            setRows(rows);
        });
    }, []);

    return (
        <main className={classes.content}>
            <div className={classes.appBarSpacer} />
            {activeRows.length > 0 &&
                <CancelAnalysisDialog
                    open={cancel}
                    affectedRows={activeRows}
                    title={
                        activeRows.length === 1
                        ? `Stop Analysis?`
                        : `Stop Analyses?`
                    }
                    onClose={() => { setCancel(false) }}
                    onAccept={() => {
                        // TODO: PATCH goes here for cancelling analyses

                        // If successful...
                        const newRows = [...rows];
                        let count = 0;
                        newRows.forEach((row, index, arr) => {
                            if (row.selected && cancelFilter(row)) {
                                const newRow: Analysis = { ...newRows[index] };
                                newRow.state = PipelineStatus.CANCELLED;
                                newRows[index] = newRow;
                                count++;
                            }
                        });

                        setRows(newRows);
                        setCancel(false);
                        enqueueSnackbar(`${count} ${count !== 1 ? 'analyses' : 'analysis'} cancelled successfully`);
                    }}
                    cancelFilter={cancelFilter}
                    labeledByPrefix={`${rowsToString(activeRows, "-")}`}
                    describedByPrefix={`${rowsToString(activeRows, "-")}`}
                />}

            {activeRows.length > 0 &&
                <AnalysisInfoDialog
                    open={detail}
                    analysis={activeRows[0]}
                    onClose={() => { setDetail(false) }}
                />}

            <AddAnalysisAlert
                open={direct}
                onClose={() => { setDirect(false) }}
                onAccept={() => { setDirect(false); history.push("/datasets") }}
            />

            {activeRows.length > 0 &&
                <SetAssigneeDialog
                    affectedRows={activeRows}
                    open={assignment}
                    onClose={() => { setAssignment(false); }}
                    onSubmit={async (username) => {
                        let count = 0;
                        for (const row of activeRows) {
                            const response = await fetch('/api/analyses/'+row.analysis_id, {
                                method: "PATCH",
                                body: JSON.stringify({ assignee: username }),
                                headers: {
                                    'Content-Type': 'application/json'
                                }
                            });
                            if (response.ok) {
                                const newRow = await response.json();
                                setRows(rows.map((oldRow) =>
                                    oldRow.analysis_id === newRow.analysis_id
                                    ? { ...oldRow, ...newRow }
                                    : oldRow
                                ));
                                count++;
                            } else {
                                console.error(response);
                            }
                        }
                        setAssignment(false);
                        enqueueSnackbar(`${count} analyses assigned to user '${username}'`)
                    }}
                />}

            <Container maxWidth="lg" className={classes.container}>
                <MaterialTable
                    columns={[
                        { title: 'Analysis ID', field: 'analysis_id', type: 'string', editable: 'never', width: '8%' },
                        { title: 'Pipeline', field: 'pipeline_id', type: 'string', editable: 'never', width: '8%' },
                        { title: 'Assignee', field: 'assignee', type: 'string', editable: 'never', width: '8%' },
                        { title: 'Requester', field: 'requester', type: 'string', editable: 'never', width: '8%' },
                        { title: 'Updated', field: 'updated', type: 'string', editable: 'never', render: rowData => formatDateString(rowData.updated) },
                        { title: 'Result HPF Path', field: 'result_hpf_path', type: 'string', emptyValue: emptyCellValue },
                        { title: 'Status', field: 'state', type: 'string', editable: 'never', defaultFilter: chipFilter },
                        { title: 'Notes', field: 'notes', type: 'string', width: '30%', emptyValue: emptyCellValue,
                        editComponent: props => (
                            <TextField
                            multiline
                            value={props.value}
                            onChange={event => props.onChange(event.target.value)}
                            rows={4}
                            fullWidth
                            />
                        )}
                    ]}
                    onSelectionChange={(selectedRows, row) => {
                        setActiveRows(selectedRows);
                        // Use hidden 'selected' field to optimize mass cancellation, reassignment, etc.
                        const newRows = [...rows];

                        if (row) {  // one row changed
                            const index = rows.indexOf(row);
                            const newRow: Analysis = { ...newRows[index] };
                            newRow.selected = !row.selected;
                            newRows[index] = newRow;
                        }
                        else {  // all rows changed
                            if (selectedRows.length === rows.length)
                                newRows.forEach((val, i, arr) => arr[i] = { ...arr[i], selected: true });
                            else
                                newRows.forEach((val, i, arr) => arr[i] = { ...arr[i], selected: false });
                        }
                        setRows(newRows);
                    }}
                    data={rows}
                    title={
                        <Title>Active Analyses</Title>
                    }
                    options={{
                        pageSize: 10,
                        filtering: true,
                        search: false,
                        padding: 'dense',
                        selection: true
                    }}
                    actions={[
                        {
                            icon: Visibility,
                            tooltip: 'Analysis details',
                            position: 'row',
                            onClick: (event, rowData) => {
                                // We can only view details of one row at a time
                                setActiveRows([rowData as Analysis]);
                                setDetail(true);
                            }
                        },
                        {
                            icon: Cancel,
                            tooltip: 'Cancel analysis',
                            position: 'toolbarOnSelect',
                            onClick: (event, rowData) => {
                                setActiveRows(rowData as Analysis[]);
                                setCancel(true);
                            },
                        },
                        {
                            icon: Add,
                            tooltip: 'Add New Analysis',
                            position: 'toolbar',
                            isFreeAction: true,
                            onClick: (event) => setDirect(true)
                        },
                        {
                            icon: PlayArrow,
                            tooltip: 'Run analysis',
                            position: 'toolbarOnSelect',
                            onClick: (event, rowData) => {
                                setActiveRows(rowData as Analysis[]);
                                // TODO: PATCH here to start pending analyses

                                // If successful...
                                const newRows = [...rows];
                                let count = 0;
                                newRows.forEach((row, index, arr) => {
                                    if (row.selected && runFilter(row)) {
                                        const newRow: Analysis = { ...newRows[index] };
                                        newRow.state = PipelineStatus.RUNNING;
                                        newRows[index] = newRow;
                                        count++;
                                    }
                                });

                                setRows(newRows);
                                enqueueSnackbar(`${count} ${count !== 1 ? 'analyses' : 'analysis'} started successfully`);
                            },
                        },
                        {
                            icon: PersonPin,
                            tooltip: "Assign to...",
                            onClick: (event, rowData) => {
                                // Data handled by SetAssigneeDialog onSubmit
                                setActiveRows(rowData as Analysis[]);
                                setAssignment(true);
                            }
                        }
                    ]}
                    editable={{
                        onRowUpdate: async (newData, oldData) => {
                                const response = await fetch('/api/analyses/'+newData.analysis_id, {
                                    method: "PATCH",
                                    body: JSON.stringify({ notes: newData.notes, result_hpf_path: newData.result_hpf_path }),
                                    headers: {
                                        'Content-Type': 'application/json'
                                    }
                                });
                                if (response.ok) {
                                    const newRow = await response.json();
                                    setRows(rows.map((row) =>
                                        row.analysis_id === newRow.analysis_id
                                        ? { ...row, ...newRow }
                                        : row
                                    ));
                                    enqueueSnackbar(`Analysis ID ${oldData?.analysis_id} edited successfully`);
                                } else {
                                    console.error(response);
                                }
                            }
                    }}
                    cellEditable={{
                        onCellEditApproved: (newValue, oldValue, editedRow, columnDef) =>
                            new Promise((resolve, reject) => {
                                const dataUpdate = [...rows];
                                const index = dataUpdate.findIndex((row, index, obj) => {
                                    return row.analysis_id === editedRow.analysis_id;
                                });
                                const newRow: Analysis = { ...dataUpdate[index] };

                                if (newValue === '')
                                    newValue = null;

                                switch (columnDef.field) {
                                    case 'result_hpf_path':
                                        newRow.result_hpf_path = newValue;
                                        break;
                                    case 'notes':
                                        newRow.notes = newValue;
                                        break;
                                    default:
                                        break;
                                }
                                dataUpdate[index] = newRow;
                                setRows(dataUpdate);
                                resolve();
                            }),

                    }}
                    components={{
                        Toolbar: props => (
                            <div>
                                <MTableToolbar {...props} />
                                <div style={{ marginLeft: '24px' }}>
                                    <Chip label="Completed" clickable className={classes.chip} onClick={() => setChipFilter(PipelineStatus.COMPLETED)} />
                                    <Chip label="Running" clickable className={classes.chip} onClick={() => setChipFilter(PipelineStatus.RUNNING)} />
                                    <Chip label="Pending" clickable className={classes.chip} onClick={() => setChipFilter(PipelineStatus.PENDING)} />
                                    <Chip label="Error" clickable className={classes.chip} onClick={() => setChipFilter(PipelineStatus.ERROR)} />
                                    <Chip label="Cancelled" clickable className={classes.chip} onClick={() => setChipFilter(PipelineStatus.CANCELLED)} />
                                    <IconButton onClick={() => setChipFilter("")}> <Cancel/> </IconButton>
                                </div>
                            </div>
                            )
                    }}
                />
            </Container>
        </main>
    )
}
