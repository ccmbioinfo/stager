import React, { useEffect } from 'react';
import { makeStyles, Container, Grid, Paper } from '@material-ui/core';
import DataEntryTable from './DataEntryTable';

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

export default function AddParticipants() {
    const classes = useStyles();

    useEffect(() => {
        document.title = "Add Participants | ST2020";
    }, []);

    return (
        <main className={classes.content}>
            <div className={classes.appBarSpacer} />
            <Container className={classes.container} maxWidth="lg">
                <Paper>
                    <DataEntryTable />
                </Paper>
            </Container>
        </main>
    );
}