import React, { useEffect, useState } from "react";
import { makeStyles, Container, Button } from "@material-ui/core";
import { CloudUpload } from "@material-ui/icons";
import DataEntryTable from "./DataEntryTable";
import { DataEntryRow } from "../utils/typings";

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
    buttonContainer: {
        padding: theme.spacing(2),
    },
    submitButton: {
        width: "40%",
        bottom: theme.spacing(3),
        left: "30%",
        right: "30%",
    },
}));

export default function AddParticipants() {
    const classes = useStyles();
    const [data, setData] = useState<DataEntryRow[]>([]);

    useEffect(() => {
        document.title = "Add Participants | ST2020";
    }, []);

    async function handleSubmit() {
        const response = await fetch('/api/_bulk', {

        })
    }

    return (
        <main className={classes.content}>
            <div className={classes.appBarSpacer} />
            <Container className={classes.container} maxWidth={false}>
                <DataEntryTable data={data} onChange={setData}/>
            </Container>
            <Container className={classes.buttonContainer} maxWidth={false}>
                <Button
                    className={classes.submitButton}
                    variant="contained"
                    color="primary"
                    size="large"
                    endIcon={<CloudUpload />}
                    onClick={() => handleSubmit()}
                >
                    Submit
                </Button>
            </Container>
        </main>
    );
}
