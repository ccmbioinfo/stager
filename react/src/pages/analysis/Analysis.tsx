import React, { useEffect, useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Container from '@material-ui/core/Container';
import VisibilityIcon from '@material-ui/icons/Visibility';
import CancelIcon from '@material-ui/icons/Cancel';
import AddIcon from '@material-ui/icons/Add';
import MaterialTable from 'material-table';
import Title from '../Title';
import CancelAnalysisDialog from './CancelAnalysisDialog';
import AnalysisInfoDialog from './AnalysisInfoDialog';

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

export interface AnalysisRun {
    id: number;
    analysisID: string;
    dateSubmitted: string;
    submittedBy: string;
    project: string;
    participants: string[];
    pipeline: string;
    timeElapsed: string;
    status: PipelineStatus;
}

// generate fake analysis data
function createAnalysis(
    id: number,
    analysisID: string,
    dateSubmitted: string,
    submittedBy: string,
    project: string,
    participants: string[],
    pipeline: string,
    timeElapsed: string,
    status: PipelineStatus): AnalysisRun {
    return { id, analysisID, dateSubmitted, submittedBy, project, participants, pipeline, timeElapsed, status };
}

const analyses = [
    createAnalysis(0, 'AN20392', '2020-05-23', 'User A', '1000', ['AA920', 'AA921', 'AA922'], 'CRE', '.5hrs', PipelineStatus.RUNNING),
    createAnalysis(1, 'AN30092', '2020-06-13', 'User A', '2030', ['AA410', 'AA411', 'AA412'], 'CRE', '1hr', PipelineStatus.RUNNING),
    createAnalysis(2, 'AN43820', '2020-06-19', 'User B', '4030', ['BB024', 'BB025', 'BB026'], 'CRG', '2hrs', PipelineStatus.RUNNING),
    createAnalysis(3, 'AN38292', '2020-06-22', 'User A', '3291', ['AA810', 'AA811', 'AA812', 'AA813'], 'CRG', '2hrs', PipelineStatus.RUNNING),
    createAnalysis(4, 'AN33889', '2020-06-21', 'User C', '3289', ['CC330'], 'CRE', '17hrs', PipelineStatus.RUNNING),
    createAnalysis(5, 'AN38920', '2020-06-21', 'User A', '2382', ['AC289', 'AC290', 'AC291'], 'CRG', '20hrs', PipelineStatus.RUNNING),
    createAnalysis(6, 'AN38921', '2020-06-19', 'User B', '4182', ['AA337', 'AA338', 'AA339'], 'CRG', '47hrs', PipelineStatus.COMPLETED),
    createAnalysis(7, 'AN38991', '2020-06-19', 'User B', '3271', ['AA320'], 'CRE', '20hrs', PipelineStatus.COMPLETED),
    createAnalysis(8, 'AN20032', '2020-06-20', 'User C', '3839', ['CC773', 'CC774', 'CC775'], 'CRE', '22hrs', PipelineStatus.ERROR),
];

export default function Analysis() {
    const classes = useStyles();
    const [detail, setDetail] = useState(false);
    const [cancel, setCancel] = useState(false);
    const [activeRow, setActiveRow] = useState<AnalysisRun | null>(null);

    useEffect(() => {
        document.title = "Analyses | ST2020";
    }, []);

    return (
        <main className={classes.content}>
            <div className={classes.appBarSpacer} />
            <CancelAnalysisDialog
                open={cancel}
                title={`Stop Analysis ${activeRow ? (activeRow as AnalysisRun).analysisID : ""}?`}
                message={`Do you really want to stop the analysis of samples ${activeRow ? (activeRow as AnalysisRun).participants.join(', ') : ""}? Stopping an analysis will delete all intermediate files and progress. Input files will remain untouched.`}
                onClose={() => { setCancel(false) }}
            />
            <AnalysisInfoDialog
                open={detail}
                analysisRun={activeRow}
                onClose={() => setDetail(false)}
            />
            <Container maxWidth="lg" className={classes.container}>
                <MaterialTable
                columns={[
                    { title: 'AnalysisID', field: 'analysisID', type: 'string' },
                    { title: 'Submitted', field: 'dateSubmitted', type: 'string' },
                    { title: 'Submitted By', field: 'submittedBy', type: 'string' },
                    { title: 'Project', field: 'project', type: 'string' },
                    { title: 'Participants', field: 'participants', type: 'string' },
                    { title: 'Pipeline', field: 'pipeline', type: 'string' },
                    { title: 'Status', field: 'status', type: 'string' }
                ]}
                data={analyses}
                title={
                    <Title>Active Analyses</Title>
                }
                options={{
                    pageSize: 10,
                }}
                actions={[
                    {
                      icon: VisibilityIcon,
                      tooltip: 'Analysis details',
                      onClick: (event, rowData) => {
                        setActiveRow((rowData as AnalysisRun))
                        setDetail(true)
                      }
                    },
                    rowData => ({
                        icon: CancelIcon,
                        tooltip: 'Cancel analysis',
                        onClick: () => {{
                          setActiveRow(rowData)
                          setCancel(true)
                        }},
                        disabled: rowData.status != PipelineStatus.RUNNING,
                    }),
                    {
                        icon: AddIcon,
                        tooltip: 'Add User',
                        isFreeAction: true,
                        onClick: (event) => alert("Select some datasets over at the Participants tab if you want to create a new analysis!")
                    }
                ]}
                />
            </Container>
        </main>
    )
}
