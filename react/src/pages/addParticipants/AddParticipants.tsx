import React, { useEffect } from 'react';
import { makeStyles, Container, Grid, Paper } from '@material-ui/core';
import ParticipantTable from '../participants/ParticipantTable';
import DataEntryTable from './DataEntryTable';
import { Height } from '@material-ui/icons';

const useStyles = makeStyles(theme => ({
    appBarSpacer: theme.mixins.toolbar,
    content: {
        flexGrow: 1,
        height: '100vh',
        overflow: 'auto',
        border: "red solid 1px ",
    },
    container: {
        marginTop: theme.spacing(3),
        marginBottom: theme.spacing(3),
    },
    paper: {
        // border: "black solid 1px ",
    }
}));

export default function AddParticipants() {
    const classes = useStyles();

    useEffect(() => {
        document.title = "Participants | ST2020";
    }, []);

    return (
        <main className={classes.content}>
            <div className={classes.appBarSpacer} />
            <Container className={classes.container} maxWidth="lg">
                <Paper className={classes.paper}>
                    <DataEntryTable />
                </Paper>
            </Container>
        </main>
    );
}