import React, { useEffect } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Container from '@material-ui/core/Container';
import Grid from '@material-ui/core/Grid';
import Paper from '@material-ui/core/Paper';
import AnalysisTable from './AnalysisTable';
import SamplesTable from './SamplesTable';

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
}));

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
                        <Paper className={classes.paper}>
                            <AnalysisTable />
                        </Paper>
                    </Grid>
                </Grid>
            </Container>
            <Container>
                <Grid container spacing={0}>
                    <Grid item xs={12}>

                            <SamplesTable />
                    </Grid>
                </Grid>
            </Container>
        </main>
    );
}
