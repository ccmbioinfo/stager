import React, { useEffect } from 'react';
import { makeStyles, Container, Grid } from '@material-ui/core';
import ParticipantTable from './ParticipantTable';
import NotificationPanel from './NotificationPanel';
import { PipelineStatus, createAnalysis } from '../analysis/Analysis';

const useStyles = makeStyles(theme => ({
    appBarSpacer: theme.mixins.toolbar,
    content: {
        flexGrow: 1,
        height: '100vh',
        overflow: 'auto',
    },
    container: {
        marginTop: theme.spacing(3),
        marginBottom: theme.spacing(3),
    },
}));

//generate fake data
const analyses = [
    createAnalysis("A0000", "P01", '/path/to/file/', "User 2", "User 3", PipelineStatus.COMPLETED, '2020-05-23 12:09 PM', "Notes example"),
    createAnalysis("A0001", "P02", '/example/path/', "User 4", "User 3", PipelineStatus.RUNNING, '2020-06-13 1:09 AM', ""),
    createAnalysis("A0002", "P01", '/foo/', "User 2", "User 5", PipelineStatus.ERROR, '2020-06-19 4:32 AM', ""),
    createAnalysis("A0003", "P02", '/foo/bar/', "User 3", "User 1", PipelineStatus.PENDING, '2020-06-22 8:56 PM', "Do not run until later."),
];

export default function Dashboard() {
    const classes = useStyles();

    useEffect(() => {
        document.title = "Dashboard | ST2020";
    }, []);

    return (
        <main className={classes.content}>
            <div className={classes.appBarSpacer} />
            <Container maxWidth="lg" className={classes.container}>
                <Grid container spacing={0}>
                    <Grid item xs={12}>
                        <NotificationPanel analyses={analyses} />
                    </Grid>
                </Grid>
            </Container>
            <Container className={classes.container}>
                <Grid container spacing={0}>
                    <Grid item xs={12}>
                        <ParticipantTable />
                    </Grid>
                </Grid>
            </Container>
        </main>
    );
}
