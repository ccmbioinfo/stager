import React, { useEffect } from "react";
import { makeStyles, Container, Grid, Paper } from "@material-ui/core";
import Card from "../Card";
import DatasetTable from "./DatasetTable";

const useStyles = makeStyles(theme => ({
    appBarSpacer: theme.mixins.toolbar,
    content: {
        flexGrow: 1,
        height: "100vh",
        overflow: "auto",
    },
    container: {
        paddingTop: theme.spacing(3),
        paddingBottom: theme.spacing(3),
    },
    paper: {
        padding: theme.spacing(2),
        display: "flex",
        overflow: "auto",
        flexDirection: "column",
    },
}));

export default function Datasets() {
    const classes = useStyles();

    useEffect(() => {
        document.title = "Datasets | ST2020";
    }, []);

    return (
        <main className={classes.content}>
            <div className={classes.appBarSpacer} />
            <Container maxWidth="lg" className={classes.container}>
                <Grid container spacing={2}>
                    <Grid item xs={4}>
                        <Paper className={classes.paper}>
                            <Card
                                title="Participants"
                                value="2731"
                                textSecondary="12 since last week"
                                linkText="Participant View"
                            />
                        </Paper>
                    </Grid>
                    <Grid item xs={4}>
                        <Paper className={classes.paper}>
                            <Card
                                title="Datasets"
                                value="3012"
                                textSecondary="3 CES, 5 RES since last week"
                                linkText="Dataset View"
                            />
                        </Paper>
                    </Grid>
                    <Grid item xs={4}>
                        <Paper className={classes.paper}>
                            <Card
                                title="Families"
                                value="728"
                                textSecondary="2 since last week"
                                linkText="Family View"
                            />
                        </Paper>
                    </Grid>
                </Grid>
            </Container>
            <Container>
                <Grid container spacing={0}>
                    <Grid item xs={12}>
                        <DatasetTable />
                    </Grid>
                </Grid>
            </Container>
        </main>
    );
}
