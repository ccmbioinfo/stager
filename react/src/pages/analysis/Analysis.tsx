import React, { useEffect, useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Chip, IconButton, TextField, Tooltip, Typography, Container } from '@material-ui/core';
import { Cancel, Description, Add, Visibility } from '@material-ui/icons';
import MaterialTable, { MTableToolbar } from 'material-table';
import { useHistory } from 'react-router';
import Title from '../Title';
import CancelAnalysisDialog from './CancelAnalysisDialog';
import AnalysisInfoDialog from './AnalysisInfoDialog';
import AddAnalysisAlert from './AddAnalysisAlert';

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
}

export interface AnalysisRow {
    analysis_id: number;
    pipeline_id: number; // Display pipeline name?
    result_hpf_path: string;
    assignee: number;  // show ID or username?
    requester: number; // show ID or username?
    state: PipelineStatus;
    updated: string; // Date type maybe?
    notes: string;
    /*
    More fields can go here as required;
    MaterialTable columns only need to cover a subset of 
    fields in this interface. 
    */
}

// generate fake analysis data
function createAnalysis(
    analysis_id: number,
    pipeline_id: number,
    result_hpf_path: string,
    assignee: number,
    requester: number,
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
        notes
    };
}

// fake notes
const loremIpsum = [
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus vestibulum, urna ac iaculis congue, urna justo accumsan ligula.",
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas rhoncus libero at ornare pellentesque. Etiam consequat nullam.",
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce rutrum hendrerit mi, at dignissim mauris porttitor ut. Cras odio."
]

const analyses = [
    createAnalysis(0, 1, '/path/to/file/', 2, 3, PipelineStatus.COMPLETED, '2020-05-23 12:09 PM', loremIpsum[0]),
    createAnalysis(1, 2, '/example/path/', 4, 3, PipelineStatus.RUNNING, '2020-06-13 1:09 AM', loremIpsum[1]),
    createAnalysis(2, 1, '/foo/', 2, 5, PipelineStatus.ERROR, '2020-06-19 4:32 AM', loremIpsum[2]),
    createAnalysis(3, 2, '/foo/bar/', 3, 1, PipelineStatus.PENDING, '2020-06-22 8:56 PM', loremIpsum[2]),
    createAnalysis(4, 3, '/foo/bar/', 1, 2, PipelineStatus.PENDING, '2020-06-21 8:09 AM', loremIpsum[0]),
    createAnalysis(5, 3, '/foo/baz/', 4, 4, PipelineStatus.RUNNING, '2020-06-21 1:22 PM', loremIpsum[1]),
    createAnalysis(6, 2, '/bar/baz/', 1, 5, PipelineStatus.PENDING, '2020-06-19 10:00 AM', loremIpsum[2]),
    createAnalysis(7, 3, '/example/path/', 2, 5, PipelineStatus.RUNNING, '2020-06-19 9:09 AM', loremIpsum[0]),
    createAnalysis(8, 3, '/example/path/', 5, 4, PipelineStatus.COMPLETED, '2020-06-20 7:07 AM', loremIpsum[1])
];

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

export default function Analysis() {
    const classes = useStyles();
    const [detail, setDetail] = useState(false);
    const [cancel, setCancel] = useState(false);
    const [activeRow, setActiveRow] = useState<AnalysisRow | null>(null);
    const [direct, setDirect] = useState(false);
    const [rows, setRows] = useState<AnalysisRow[]>([]);
    const [chipFilter, setChipFilter] = useState<string>(""); // filter by state

    const history = useHistory();

    useEffect(() => {
        document.title = "Analyses | ST2020";

        // TODO: Fetch data here
        setRows(analyses);

    }, []);

    return (
        <main className={classes.content}>
            <div className={classes.appBarSpacer} />
            {activeRow &&
                <CancelAnalysisDialog
                    open={cancel}
                    title={`Stop Analysis ${activeRow.analysis_id}?`}
                    // Message used to say which participants were involved in the analysis
                    message={`Do you really want to stop this analysis? Stopping an analysis will delete all intermediate files and progress. Input files will remain untouched.`}
                    onClose={() => { setCancel(false) }}
                    labeledByPrefix={`${activeRow.analysis_id}`}
                    describedByPrefix={`${activeRow.analysis_id}`}
                />}
            {activeRow &&
                <AnalysisInfoDialog
                    open={detail}
                    analysis={activeRow}
                    onClose={() => setDetail(false)}
                />}

            <AddAnalysisAlert
                open={direct}
                onClose={() => { setDirect(false) }}
                onAccept={() => { setDirect(false); history.push("/participants") }}
            />
            <Container maxWidth="lg" className={classes.container}>
                <MaterialTable
                    columns={[
                        { title: 'Analysis ID', field: 'analysis_id', type: 'numeric', editable: 'never', width: '8%' },
                        { title: 'Pipeline ID', field: 'pipeline_id', type: 'numeric', editable: 'never', width: '8%' },
                        { title: 'Assignee ID', field: 'assignee', type: 'numeric', editable: 'never', width: '8%' },
                        { title: 'Requester ID', field: 'requester', type: 'numeric', editable: 'never', width: '8%' },
                        { title: 'Updated', field: 'updated', type: 'string', editable: 'never' },
                        { title: 'Result HPF Path', field: 'result_hpf_path', type: 'string' },
                        { title: 'Status', field: 'state', type: 'string', editable: 'never', defaultFilter: chipFilter },
                        { title: 'Notes', field: 'notes', type: 'string', width: '30%', /* render: renderNotes, */
                        editComponent: props => (
                            <TextField
                            multiline
                            value={props.value}
                            onChange={props.onChange}
                            rows={4}
                            fullWidth
                            />
                        )}
                    ]}
                    data={rows}
                    title={
                        <Title>Active Analyses</Title>
                    }
                    options={{
                        pageSize: 10,
                        filtering: true,
                        search: false,
                        padding: 'dense'
                    }}
                    actions={[
                        {
                            icon: Visibility,
                            tooltip: 'Analysis details',
                            onClick: (event, rowData) => {
                                setActiveRow((rowData as AnalysisRow))
                                setDetail(true)
                            }
                        },
                        rowData => ({
                            icon: Cancel,
                            tooltip: 'Cancel analysis',
                            onClick: () => {
                                setActiveRow(rowData)
                                setCancel(true)
                            },
                            disabled: rowData.state !== PipelineStatus.RUNNING,
                        }),
                        {
                            icon: Add,
                            tooltip: 'Add New Analysis',
                            isFreeAction: true,
                            onClick: (event) => setDirect(true)
                        }
                    ]}
                    editable={{
                        onRowUpdate: (newData, oldData) =>
                            new Promise((resolve, reject) => {
                                const dataUpdate = [...rows];
                                // find the row; assume analysis_id is unique
                                const index = dataUpdate.findIndex((row, index, obj) => {
                                    return row.analysis_id === oldData?.analysis_id
                                });

                                // only update the rows that are allowed
                                dataUpdate[index].notes = newData.notes;
                                dataUpdate[index].result_hpf_path = newData.result_hpf_path;
                                setRows([...dataUpdate]);

                                // TODO: Send PATCH here

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
                                    <IconButton onClick={() => setChipFilter("")}> <Cancel/> </IconButton>
                                </div>
                            </div>
                        ),
                    }}
                />
            </Container>
        </main>
    )
}
