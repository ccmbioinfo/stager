import React, { useEffect, useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Container from '@material-ui/core/Container';
import Grid from '@material-ui/core/Grid';
import Paper from '@material-ui/core/Paper';
import Table from '@material-ui/core/Table';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import TableCell from '@material-ui/core/TableCell';
import TableBody from '@material-ui/core/TableBody';
import Checkbox from '@material-ui/core/Checkbox';
import Button from '@material-ui/core/Button';
import VisibilityIcon from '@material-ui/icons/Visibility';
import { Dialog, DialogTitle, DialogContent } from '@material-ui/core';
import Title from '../Title';

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

interface AnalysisRun {
    id: number;
    analysisID: string;
    dateSubmitted: string;
    submittedBy: string;
    project: string;
    participants: string[];
    pipeline: string;
    timeElapsed: string;
    status: string;
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
    status: string): AnalysisRun {
    return { id, analysisID, dateSubmitted, submittedBy, project, participants, pipeline, timeElapsed, status };
}

const analyses = [
    createAnalysis(0, 'AN20392', '2020-05-23', 'User A', '1000', ['AA920', 'AA921', 'AA922'], 'CRE', '.5hrs', 'Running'),
    createAnalysis(1, 'AN30092', '2020-06-13', 'User A', '2030', ['AA410', 'AA411', 'AA412'], 'CRE', '1hr', 'Running'),
    createAnalysis(2, 'AN43820', '2020-06-19', 'User B', '4030', ['BB024', 'BB025', 'BB026'], 'CRG', '2hrs', 'Running'),
    createAnalysis(3, 'AN38292', '2020-06-22', 'User A', '3291', ['AA810', 'AA811', 'AA812', 'AA813'], 'CRG', '2hrs', 'Running'),
    createAnalysis(4, 'AN33889', '2020-06-21', 'User C', '3289', ['CC330'], 'CRE', '17hrs', 'Running'),
    createAnalysis(5, 'AN38920', '2020-06-21', 'User A', '2382', ['AC289', 'AC290', 'AC291'], 'CRG', '20hrs', 'Running'),
    createAnalysis(6, 'AN38921', '2020-06-19', 'User B', '4182', ['AA337', 'AA338', 'AA339'], 'CRG', '47hrs', 'Completed'),
    createAnalysis(7, 'AN38991', '2020-06-19', 'User B', '3271', ['AA320'], 'CRE', '20hrs', 'Completed'),
    createAnalysis(8, 'AN20032', '2020-06-20', 'User C', '3839', ['CC773', 'CC774', 'CC775'], 'CRE', '22hrs', 'Error'),
];

export default function Analysis() {
    const classes = useStyles();
    const [open, setOpen] = useState(false);
    const [activeRow, setActiveRow] = useState<AnalysisRun | null>(null);

    useEffect(() => {
        document.title = "Analyses | ST2020";
    }, []);

    const formatDialog = (row: AnalysisRun) => {
        return (
            <div>
                <DialogTitle className={classes.dialogHeader}>Analysis {row.analysisID}</DialogTitle>
                <DialogContent>
                    <div className={classes.statusTitle}><b>{row.status}</b></div>
                    <Grid container spacing={0}>
                        <Grid item xs={12}>
                            <b>Project: </b>{row.project}
                        </Grid>
                        <Grid item xs={12}>
                            <b>Date Submitted: </b>{row.dateSubmitted}
                        </Grid>
                    </Grid>
                </DialogContent>
            </div>
        )
    }

    return (
        <main className={classes.content}>
            <div className={classes.appBarSpacer} />
            <Container maxWidth="lg" className={classes.container}>
                <Paper className={classes.paper}>

                    <Grid container spacing={0}>
                        <Grid item xs={12}>
                            <Title>Active Analyses</Title>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell className={classes.centreItem}>View</TableCell>
                                        <TableCell>AnalysisID</TableCell>
                                        <TableCell>Submitted</TableCell>
                                        <TableCell>Submitted By</TableCell>
                                        <TableCell>Project</TableCell>
                                        <TableCell>Participants</TableCell>
                                        <TableCell>Pipeline</TableCell>
                                        <TableCell>Status</TableCell>
                                        <TableCell className={classes.centreItem}>Download</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {analyses.map((row) => (
                                        <TableRow key={row.id} >
                                            <TableCell onClick={() => { setOpen(true); setActiveRow(row) }} className={classes.viewIcon}><VisibilityIcon fontSize="small" /></TableCell>
                                            <TableCell>{row.analysisID}</TableCell>
                                            <TableCell>{row.dateSubmitted}</TableCell>
                                            <TableCell>{row.submittedBy}</TableCell>
                                            <TableCell>{row.project}</TableCell>
                                            <TableCell>{row.participants.join(", ")}</TableCell>
                                            <TableCell>{row.pipeline}</TableCell>
                                            <TableCell>{row.status}</TableCell>
                                            <TableCell className={classes.centreItem}><Checkbox size='small' /></TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </Grid>
                        <Grid item xs={12}>
                            <Button size="small" className={classes.downloadButton} variant="contained" color="primary">Download Selected</Button>
                        </Grid>
                    </Grid>
                </Paper>
                <Dialog
                    open={open}
                    onClose={() => { setOpen(false) }}
                    aria-labelledby="max-width-dialog-title"
                >
                    {(activeRow) ? formatDialog(activeRow) : ''}
                </Dialog>
            </Container>
        </main>
    );
}
