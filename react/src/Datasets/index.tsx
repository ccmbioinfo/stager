import React, { useEffect } from "react";
import { makeStyles, Container, Grid } from "@material-ui/core";
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
    paper: {
        padding: theme.spacing(2),
        display: "flex",
        overflow: "auto",
        flexDirection: "column",
    },
}));

interface DatasetsProps {
    isAdmin: boolean;
}

export default function Datasets({ isAdmin }: DatasetsProps) {
    const classes = useStyles();

    useEffect(() => {
        document.title = "Datasets | ST2020";
    }, []);

    return (
        <main className={classes.content}>
            <div className={classes.appBarSpacer} />
            <Container maxWidth={false} className={classes.container}>
                <Grid container spacing={0}>
                    <Grid item xs={12}>
                        <DatasetTable isAdmin={isAdmin} />
                    </Grid>
                </Grid>
            </Container>
        </main>
    );
}
