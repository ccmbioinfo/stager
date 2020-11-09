import React, { useEffect } from 'react';
import { makeStyles, Container, Button } from '@material-ui/core';
import {CloudUpload} from '@material-ui/icons';

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
    submitButton: {
        position: "fixed",
        width: "40%",
        bottom: theme.spacing(3),
        left: "30%",
        right: "30%"
    }
}));

export default function AddParticipants() {
    const classes = useStyles();

    useEffect(() => {
        document.title = "Add Participants | ST2020";
    }, []);

    return (
        <main className={classes.content}>
            <div className={classes.appBarSpacer} />
            <Container className={classes.container} maxWidth={false}>
                {/* data entry table here*/}
                <Button className={classes.submitButton} variant="contained" color="primary" size="large" endIcon={<CloudUpload />} >
                    Submit
                </Button>
            </Container>
        </main>
    );
}