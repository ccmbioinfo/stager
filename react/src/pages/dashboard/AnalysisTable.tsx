import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Grid from '@material-ui/core/Grid';
import Link from '@material-ui/core/Link';
import Paper from '@material-ui/core/Paper';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import { PipelineStatus } from '../analysis/Analysis';

import Title from '../Title';

interface AnalysisRun {
    id: number;
    dateSubmitted: string;
    project: string;
    pipeline: string;
    timeElapsed: string;
    status: PipelineStatus;
}

// generate fake analysis data
function createAnalysis(
    id: number,
    dateSubmitted: string,
    project: string,
    pipeline: string,
    timeElapsed: string,
    status: PipelineStatus): AnalysisRun {
    return { id, dateSubmitted, project, pipeline, timeElapsed, status };
}

const pending = [
    createAnalysis(0, '2020-05-23', '1000', 'CRE', '-', PipelineStatus.PENDING),
    createAnalysis(1, '2020-06-13', '2030', 'CRE', '-', PipelineStatus.PENDING),
    createAnalysis(2, '2020-06-19', '4030', 'CRG', '-', PipelineStatus.PENDING),
];

const running = [
    createAnalysis(0, '2020-07-08', '3291', 'CRG', '2hrs', PipelineStatus.RUNNING),
    createAnalysis(1, '2020-07-07', '3289', 'CRE', '17hrs', PipelineStatus.RUNNING),
    createAnalysis(2, '2020-07-07', '2382', 'CRG', '20hrs', PipelineStatus.RUNNING),
];

const completed = [
    createAnalysis(0, '2020-06-19', '4182', 'CRG', '47hrs', PipelineStatus.COMPLETED),
    createAnalysis(1, '2020-06-19', '3271', 'CRE', '20hrs', PipelineStatus.COMPLETED),
    createAnalysis(2, '2020-06-20', '3839', 'CRE', '22hrs', PipelineStatus.ERROR),
];

function preventDefault(event: React.MouseEvent) {
    event.preventDefault();
}

const useStyles = makeStyles(theme => ({
    seeMore: {
        marginTop: theme.spacing(3),
    },
}));



export default function AnalysisTable() {
    const classes = useStyles();

    return (
        <Grid container spacing={1}>
            <Grid item xs={4}>
                <Title>9 Pending Analyses</Title>
                <Paper variant="outlined">
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>Submitted</TableCell>
                                <TableCell>Project</TableCell>
                                <TableCell>Pipeline</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {pending.map(row => (
                                <TableRow key={row.id}>
                                    <TableCell>{row.dateSubmitted}</TableCell>
                                    <TableCell>{row.project}</TableCell>
                                    <TableCell>{row.pipeline}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Paper>
                <div className={classes.seeMore}>
                    <Link color="primary" href="#" onClick={preventDefault}>
                        See all pending analyses
                    </Link>
                </div>
            </Grid>
            <Grid item xs={4}>
                <Title>5 Running Analyses</Title>
                <Paper variant="outlined">
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>Submitted</TableCell>
                                <TableCell>Time</TableCell>
                                <TableCell>Project</TableCell>
                                <TableCell>Pipeline</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {running.map(row => (
                                <TableRow key={row.id}>
                                    <TableCell>{row.dateSubmitted}</TableCell>
                                    <TableCell>{row.timeElapsed}</TableCell>
                                    <TableCell>{row.project}</TableCell>
                                    <TableCell>{row.pipeline}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Paper>
                <div className={classes.seeMore}>
                    <Link color="primary" href="#" onClick={preventDefault}>
                        See all running analyses
                    </Link>
                </div>
            </Grid>
            <Grid item xs={4}>
                <Title>34 Completed Analyses</Title>
                <Paper variant="outlined">
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>Submitted</TableCell>
                                <TableCell>Project</TableCell>
                                <TableCell>Pipeline</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {completed.map(row => (
                                <TableRow key={row.id}>
                                    <TableCell>{row.dateSubmitted}</TableCell>
                                    <TableCell>{row.project}</TableCell>
                                    <TableCell>{row.pipeline}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Paper>
                <div className={classes.seeMore}>
                    <Link color="primary" href="#" onClick={preventDefault}>
                        See all completed analyses
                    </Link>
                </div>
            </Grid>
        </Grid>
    );
}
