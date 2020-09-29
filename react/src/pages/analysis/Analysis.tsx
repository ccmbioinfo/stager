import React, { useEffect, useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Container from '@material-ui/core/Container';
import VisibilityIcon from '@material-ui/icons/Visibility';
import CancelIcon from '@material-ui/icons/Cancel';
import AddIcon from '@material-ui/icons/Add';
import MaterialTable from 'material-table';
import { useHistory } from 'react-router';
import Title from '../Title';
import CancelAnalysisDialog from './CancelAnalysisDialog';
import AnalysisInfoDialog from './AnalysisInfoDialog';
import AddAnalysisAlert from './AddAnalysisAlert';
import { Button, Tooltip, Typography } from '@material-ui/core';

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
    }

}));

export enum PipelineStatus {
    PENDING = "Pending",
    RUNNING = "Running",
    COMPLETED = "Completed",
    ERROR = "Error",
}

// export interface AnalysisRow {
//     id: number;
//     analysisID: string;
//     dateSubmitted: string;
//     submittedBy: string;
//     project: string;
//     participants: string[];
//     pipeline: string;
//     timeElapsed: string;
//     status: PipelineStatus;
// }

export interface AnalysisRow {
    analysis_id: number;
    pipeline_id: number; // Display pipeline name?
    result_hpf_path: string;
    assignee: number;  // show ID or username?
    requester: number; // show ID or username?
    state: PipelineStatus;
    updated: string; // Date type maybe?
    notes: string;
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

// const analyses = [
//     createAnalysis(0, 'AN20392', '2020-05-23 12:09 PM', 'User A', '1000', ['AA920', 'AA921', 'AA922'], 'CRE', '.5hrs', PipelineStatus.RUNNING),
//     createAnalysis(1, 'AN30092', '2020-06-13 1:09 AM', 'User A', '2030', ['AA410', 'AA411', 'AA412'], 'CRE', '1hr', PipelineStatus.RUNNING),
//     createAnalysis(2, 'AN43820', '2020-06-19 4:32 AM', 'User B', '4030', ['BB024', 'BB025', 'BB026'], 'CRG', '2hrs', PipelineStatus.RUNNING),
//     createAnalysis(3, 'AN38292', '2020-06-22 8:56 PM', 'User A', '3291', ['AA810', 'AA811', 'AA812', 'AA813'], 'CRG', '2hrs', PipelineStatus.RUNNING),
//     createAnalysis(4, 'AN33889', '2020-06-21 8:09 AM', 'User C', '3289', ['CC330'], 'CRE', '17hrs', PipelineStatus.RUNNING),
//     createAnalysis(5, 'AN38920', '2020-06-21 1:22 PM', 'User A', '2382', ['AC289', 'AC290', 'AC291'], 'CRG', '20hrs', PipelineStatus.RUNNING),
//     createAnalysis(6, 'AN38921', '2020-06-19 10:00 AM', 'User B', '4182', ['AA337', 'AA338', 'AA339'], 'CRG', '47hrs', PipelineStatus.COMPLETED),
//     createAnalysis(7, 'AN38991', '2020-06-19 9:09 AM', 'User B', '3271', ['AA320'], 'CRE', '20hrs', PipelineStatus.COMPLETED),
//     createAnalysis(8, 'AN20032', '2020-06-20 7:07 AM', 'User C', '3839', ['CC773', 'CC774', 'CC775'], 'CRE', '22hrs', PipelineStatus.ERROR),
// ];

// fake notes
const loremIpsum = [
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus vestibulum, urna ac iaculis congue, urna justo accumsan ligula.",
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas rhoncus libero at ornare pellentesque. Etiam consequat nullam.",
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce rutrum hendrerit mi, at dignissim mauris porttitor ut. Cras odio."
]

const analyses = [
    createAnalysis(0, 1, '/example/path/', 2, 3, PipelineStatus.COMPLETED, '2020-05-23 12:09 PM', loremIpsum[0]),
    createAnalysis(1, 2, '/example/path/', 4, 3, PipelineStatus.COMPLETED, '2020-06-13 1:09 AM', loremIpsum[1]),
    createAnalysis(2, 1, '/example/path/', 2, 5, PipelineStatus.COMPLETED, '2020-06-19 4:32 AM', loremIpsum[2]),
    createAnalysis(3, 2, '/example/path/', 3, 1, PipelineStatus.COMPLETED, '2020-06-22 8:56 PM', loremIpsum[2]),
    createAnalysis(4, 3, '/example/path/', 1, 2, PipelineStatus.COMPLETED, '2020-06-21 8:09 AM', loremIpsum[0]),
    createAnalysis(5, 3, '/example/path/', 4, 4, PipelineStatus.COMPLETED, '2020-06-21 1:22 PM', loremIpsum[1]),
    createAnalysis(6, 2, '/example/path/', 1, 5, PipelineStatus.COMPLETED, '2020-06-19 10:00 AM', loremIpsum[2]),
    createAnalysis(7, 3, '/example/path/', 2, 5, PipelineStatus.COMPLETED, '2020-06-19 9:09 AM', loremIpsum[0]),
    createAnalysis(8, 3, '/example/path/', 5, 4, PipelineStatus.COMPLETED, '2020-06-20 7:07 AM', loremIpsum[1])
];

export default function Analysis() {
    const classes = useStyles();
    const [detail, setDetail] = useState(false);
    const [cancel, setCancel] = useState(false);
    const [activeRow, setActiveRow] = useState<AnalysisRow | null>(null);
    const [direct, setDirect] = useState(false);

    const history = useHistory();

    useEffect(() => {
        document.title = "Analyses | ST2020";
    }, []);

    return (
        <main className={classes.content}>
            <div className={classes.appBarSpacer} />
            {activeRow &&
                <CancelAnalysisDialog
                    open={cancel}
                    title={`Stop Analysis ${activeRow.analysis_id}?`}
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
                        { title: 'Analysis ID', field: 'analysis_id', type: 'numeric' },
                        { title: 'Updated', field: 'updated', type: 'string' },
                        { title: 'Pipeline', field: 'pipeline_id', type: 'numeric' },
                        { title: 'Status', field: 'state', type: 'string' },
                        { title: 'Notes', field: 'notes', type: 'string', 
                            render: rowData => 
                            <Tooltip title={
                                <>
                                <Typography variant="body1">{rowData.notes}</Typography>
                                </>
                            } interactive>
                                <Button>Notes...</Button>
                            </Tooltip>
                        },
                        { title: 'Assignee ID', field: 'assignee', type: 'numeric' },
                        { title: 'Requester ID', field: 'requester', type: 'numeric' },
                        { title: 'Result HPF Path', field: 'result_hpf_path', type: 'string' }
                    ]}
                    data={analyses}
                    title={
                        <Title>Active Analyses</Title>
                    }
                    options={{
                        pageSize: 10,
                        filtering: true,
                        search: false
                    }}
                    actions={[
                        {
                            icon: VisibilityIcon,
                            tooltip: 'Analysis details',
                            onClick: (event, rowData) => {
                                setActiveRow((rowData as AnalysisRow))
                                setDetail(true)
                            }
                        },
                        rowData => ({
                            icon: CancelIcon,
                            tooltip: 'Cancel analysis',
                            onClick: () => {
                                setActiveRow(rowData)
                                setCancel(true)
                            },
                            disabled: rowData.state !== PipelineStatus.RUNNING,
                        }),
                        {
                            icon: AddIcon,
                            tooltip: 'Add New Analysis',
                            isFreeAction: true,
                            onClick: (event) => setDirect(true)
                        }
                    ]}
                />
            </Container>
        </main>
    )
}
