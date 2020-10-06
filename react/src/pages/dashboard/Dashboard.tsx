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
        paddingTop: theme.spacing(3),
        paddingBottom: theme.spacing(3),
    },
}));

//generate fake data
const analyses = [
    createAnalysis(0, 'AN20392', '2020-05-23 12:09 PM', 'User A', '1000', ['AA920', 'AA921', 'AA922'], 'CRE', '.5hrs', PipelineStatus.RUNNING),
    createAnalysis(3, 'AN38292', '2020-06-22 8:56 PM', 'User A', '3291', ['AA810', 'AA811', 'AA812', 'AA813'], 'CRG', '2hrs', PipelineStatus.PENDING),
    createAnalysis(6, 'AN38921', '2020-06-19 10:00 AM', 'User B', '4182', ['AA337', 'AA338', 'AA339'], 'CRG', '47hrs', PipelineStatus.COMPLETED),
    createAnalysis(8, 'AN20032', '2020-06-20 7:07 AM', 'User C', '3839', ['CC773', 'CC774', 'CC775'], 'CRE', '22hrs', PipelineStatus.ERROR),
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
            <Container>
                <Grid container spacing={0}>
                    <Grid item xs={12}>
                        <ParticipantTable />
                    </Grid>
                </Grid>
            </Container>
        </main>
    );
}
