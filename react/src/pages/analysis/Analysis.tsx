import React, { useEffect, useState } from 'react';
import { useParams, useHistory, useLocation } from 'react-router';
import { makeStyles } from '@material-ui/core/styles';
import { Chip, IconButton, TextField, Tooltip, Typography, Container } from '@material-ui/core';
import { Cancel, Description, Add, Visibility, PlayArrow, PersonPin } from '@material-ui/icons';
import MaterialTable, { MTableToolbar } from 'material-table';
import Title from '../Title';
import CancelAnalysisDialog from './CancelAnalysisDialog';
import AnalysisInfoDialog from './AnalysisInfoDialog';
import AddAnalysisAlert from './AddAnalysisAlert';
import SetAssigneeDialog from './SetAssigneeDialog';

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

export enum PipelineStatus {
    PENDING = "Pending",
    RUNNING = "Running",
    COMPLETED = "Completed",
    ERROR = "Error",
    CANCELLED = "Cancelled"
}

export interface AnalysisRow {
    analysis_id: string;
    pipeline_id: string; // Display pipeline name?
    result_hpf_path: string;
    assignee: string;  // show ID or username?
    requester: string; // show ID or username?
    state: PipelineStatus;
    updated: string; // Date type maybe?
    notes: string;
    selected: boolean; // used for optimizing data updating
    /*
    More fields can go here as required;
    MaterialTable columns only need to cover a subset of
    fields in this interface.
    */
}

// generate fake analysis data
export function createAnalysis(
    analysis_id: string,
    pipeline_id: string,
    result_hpf_path: string,
    assignee: string,
    requester: string,
    state: PipelineStatus,
    updated: string,
    notes: string): AnalysisRow {

    return {
        analysis_id,
        pipeline_id,
        result_hpf_path,
        assignee,
        requester,
        state,
        updated,
        notes,
        selected: false
    };
}

// fake notes
const loremIpsum = [
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus vestibulum, urna ac iaculis congue, urna justo accumsan ligula.",
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas rhoncus libero at ornare pellentesque. Etiam consequat nullam.",
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce rutrum hendrerit mi, at dignissim mauris porttitor ut. Cras odio."
]

const analyses = [
    createAnalysis("A0000", "P01", '/path/to/file/', "User 2", "User 3", PipelineStatus.COMPLETED, '2020-05-23 12:09 PM', loremIpsum[0]),
    createAnalysis("A0001", "P02", '/example/path/', "User 4", "User 3", PipelineStatus.RUNNING, '2020-06-13 1:09 AM', loremIpsum[1]),
    createAnalysis("A0002", "P01", '/foo/', "User 2", "User 5", PipelineStatus.ERROR, '2020-06-19 4:32 AM', loremIpsum[2]),
    createAnalysis("A0003", "P02", '/foo/bar/', "User 3", "User 1", PipelineStatus.PENDING, '2020-06-22 8:56 PM', loremIpsum[2]),
    createAnalysis("A0004", "P03", '/foo/bar/', "User 1", "User 2", PipelineStatus.PENDING, '2020-06-21 8:09 AM', loremIpsum[0]),
    createAnalysis("A0005", "P03", '/foo/baz/', "User 4", "User 4", PipelineStatus.RUNNING, '2020-06-21 1:22 PM', loremIpsum[1]),
    createAnalysis("A0006", "P02", '/bar/baz/', "User 1", "User 5", PipelineStatus.PENDING, '2020-06-19 10:00 AM', loremIpsum[2]),
    createAnalysis("A0007", "P03", '/example/path/', "User 2", "User 5", PipelineStatus.RUNNING, '2020-06-19 9:09 AM', loremIpsum[0]),
    createAnalysis("A0008", "P03", '/example/path/', "User 5", "User 4", PipelineStatus.COMPLETED, '2020-06-20 7:07 AM', loremIpsum[1])
];


type ParamTypes = {
    analysis_id: string | undefined
}

// Displays notes as an interactive tooltip
function renderNotes(rowData: AnalysisRow) {
    return (
    <Tooltip title={
        <>
        <Typography variant="body1">{rowData.notes}</Typography>
        </>
    } interactive placement="left">
        <IconButton><Description/></IconButton>
    </Tooltip>
    );
}

// Returns the analysis IDs of the provided rows, optionally delimited with delim
function rowsToString(rows: AnalysisRow[], delim?: string) {
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

// How long to wait before refreshing data, in milliseconds
// Default: 1 min
const refreshTimeDelay = 1000 * 60;

/**
 * Convert the provided JSON Array to a valid array of AnalysisRows.
 */
function jsonToAnalysisRows(data: Array<any>): AnalysisRow[] {
    const rows: AnalysisRow[] = data.map((row, index, arr) => {
        switch (row.analysis_state) {
            case 'Requested':
                row.state = PipelineStatus.PENDING;
                break;
            case 'Running':
                row.state = PipelineStatus.RUNNING;
                break;
            case 'Done':
                row.state = PipelineStatus.COMPLETED;
                break;
            case 'Error':
                row.state = PipelineStatus.ERROR;
                break;
            case 'Cancelled':
                row.state = PipelineStatus.CANCELLED;
                break;
            default:
                row.state = null;
                break;
        }

        return { ...row, selected: false } as AnalysisRow;
    });
    return rows;
}

/**
 * Returns whether this analysis is allowed to be cancelled.
 */
function cancelFilter(row: AnalysisRow) {
    return row.state === PipelineStatus.RUNNING || row.state === PipelineStatus.PENDING;
}

/**
 * Returns whether this analysis is allowed to be run.
 */
function runFilter(row: AnalysisRow) {
    return row.state === PipelineStatus.ERROR || row.state === PipelineStatus.CANCELLED;
}

export default function Analysis() {
    const classes = useStyles();
    const { analysis_id }= useParams<ParamTypes>();
    const [rows, setRows] = useState<AnalysisRow[]>([]);
    const [detail, setDetail] = useState(false); // for detail dialog
    const [cancel, setCancel] = useState(false); // for cancel dialog
    const [direct, setDirect] = useState(false); // for add analysis dialog (re-direct)
    const [assignment, setAssignment] = useState(false); // for set assignee dialog

    const detailRow = analyses.find(analysis => analysis.analysis_id === analysis_id);
    const [activeRows, setActiveRows] = useState<AnalysisRow[]>(detailRow ? [detailRow] : []);

    const [chipFilter, setChipFilter] = useState<string>(""); // filter by state

    const [cancelAllowed, setCancelAllowed] = useState<boolean>(true);

    const history = useHistory();

    useEffect(() => {
        document.title = "Analyses | ST2020";

        // Fetch data here
        fetch('/api/analyses', { method: "GET" })
        .then(response => response.json())
        .then(data => {
            const rows = jsonToAnalysisRows(data);
            setRows(rows);
        });

        // For when the user comes from the notification panel
        if (activeRows.length > 0 && analysis_id)
            setDetail(true);

    }, []);

    return (
        <main className={classes.content}>
            <div className={classes.appBarSpacer} />
            {activeRows.length > 0 &&
                <CancelAnalysisDialog
                    open={cancel}
                    affectedRows={activeRows}
                    title={
                        activeRows.length == 1
                        ? `Stop Analysis?`
                        : `Stop Analyses?`
                    }
                    onClose={() => { setCancel(false) }}
                    onAccept={() => {
                        // TODO: PATCH goes here for cancelling analyses

                        // If successful...
                        const newRows = [...rows];
                        newRows.forEach((row, index, arr) => {
                            if (row.selected && cancelFilter(row)) {
                                const newRow: AnalysisRow = { ...newRows[index] };
                                newRow.state = PipelineStatus.CANCELLED;
                                newRows[index] = newRow;
                            }
                        });

                        setRows(newRows);
                        setCancel(false);
                    }}
                    cancelFilter={cancelFilter}
                    labeledByPrefix={`${rowsToString(activeRows, "-")}`}
                    describedByPrefix={`${rowsToString(activeRows, "-")}`}
                />}

            {activeRows.length > 0 &&
                <AnalysisInfoDialog
                    open={detail}
                    analysis={activeRows[0]}
                    onClose={() => {setDetail(false); if(analysis_id){history.goBack()}}}
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
                        activeRows.forEach(async (row) => {
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
                            } else {
                                console.error(response);
                            }
                        })
                        // TODO: PATCH goes here for setting assignees

                        // If successful...
                        const newRows = [...rows];
                        newRows.forEach((row, index, arr) => {
                            if (row.selected) {
                                const newRow: AnalysisRow = { ...newRows[index] };
                                newRow.assignee = username;
                                newRows[index] = newRow;
                            }
                        });

                        setRows(newRows);
                        setAssignment(false);

                    }}
                />}

            <Container maxWidth="lg" className={classes.container}>
                <MaterialTable
                    columns={[
                        { title: 'Analysis ID', field: 'analysis_id', type: 'string', editable: 'never', width: '8%' },
                        { title: 'Pipeline', field: 'pipeline_id', type: 'string', editable: 'never', width: '8%' },
                        { title: 'Assignee', field: 'assignee', type: 'string', editable: 'never', width: '8%' },
                        { title: 'Requester', field: 'requester', type: 'string', editable: 'never', width: '8%' },
                        { title: 'Updated', field: 'updated', type: 'string', editable: 'never' },
                        { title: 'Result HPF Path', field: 'result_hpf_path', type: 'string' },
                        { title: 'Status', field: 'state', type: 'string', editable: 'never', defaultFilter: chipFilter },
                        { title: 'Notes', field: 'notes', type: 'string', width: '30%', /* render: renderNotes, */
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
                            const newRow: AnalysisRow = { ...newRows[index] };
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

                        // Check what actions are allowed
                        let cancelAllowed = true;
                        for (const row of selectedRows) {
                            if ( !(row.state in [PipelineStatus.RUNNING, PipelineStatus.PENDING]) ) {
                                cancelAllowed = false;
                                break;
                            }
                        }
                        setCancelAllowed(cancelAllowed);
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
                                setActiveRows([rowData as AnalysisRow]);
                                setDetail(true);
                                history.push(`/analysis/${(rowData as AnalysisRow).analysis_id}`);
                            }
                        },
                        {
                            icon: Cancel,
                            tooltip: 'Cancel analysis',
                            position: 'toolbarOnSelect',
                            onClick: (event, rowData) => {
                                setActiveRows(rowData as AnalysisRow[]);
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
                                setActiveRows(rowData as AnalysisRow[]);
                                // TODO: PATCH here to start pending analyses

                                // If successful...
                                const newRows = [...rows];
                                newRows.forEach((row, index, arr) => {
                                    if (row.selected && runFilter(row)) {
                                        const newRow: AnalysisRow = { ...newRows[index] };
                                        newRow.state = PipelineStatus.RUNNING;
                                        newRows[index] = newRow;
                                    }
                                });

                                setRows(newRows);
                            },
                        },
                        {
                            icon: PersonPin,
                            tooltip: "Assign to...",
                            onClick: (event, rowData) => {
                                // Data handled by SetAssigneeDialog onSubmit
                                setActiveRows(rowData as AnalysisRow[]);
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
                                } else {
                                    console.error(response);
                                }
                            }
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
                        }
                    }
                />
            </Container>
        </main>
    )
}
