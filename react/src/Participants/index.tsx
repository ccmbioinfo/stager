import React, { useEffect } from "react";
import { makeStyles, Container, Grid } from "@material-ui/core";
import ParticipantTable from "./components/ParticipantTable";

const useStyles = makeStyles(theme => ({
    appBarSpacer: theme.mixins.toolbar,
    content: {
        flexGrow: 1,
        height: "100vh",
        overflow: "auto",
    },
    container: {
        marginTop: theme.spacing(3),
        marginBottom: theme.spacing(3),
    },
}));

export default function Participants() {
    const classes = useStyles();

    useEffect(() => {
        document.title = `Participants | ${process.env.REACT_APP_NAME}`;
    }, []);

    return (
        <main className={classes.content}>
            <div className={classes.appBarSpacer} />
            <Container className={classes.container} maxWidth={false}>
                <Grid container spacing={0}>
                    <Grid item xs={12}>
                        <ParticipantTable />
                    </Grid>
                </Grid>
            </Container>
        </main>
    );
}
