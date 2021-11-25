import React, { useEffect } from "react";
import { Container, Grid, makeStyles } from "@material-ui/core";
import DatasetTable from "./components/DatasetTable";

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
}));

export default function Datasets() {
    const classes = useStyles();

    useEffect(() => {
        document.title = `Datasets | ${process.env.REACT_APP_NAME}`;
    }, []);

    return (
        <main className={classes.content}>
            <div className={classes.appBarSpacer} />
            <Container maxWidth={false} className={classes.container}>
                <Grid container spacing={0}>
                    <Grid item xs={12}>
                        <DatasetTable />
                    </Grid>
                </Grid>
            </Container>
        </main>
    );
}
