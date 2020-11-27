import React, { useEffect, useState } from "react";
import { makeStyles, Container, Button } from "@material-ui/core";
import { CloudUpload } from "@material-ui/icons";
import { useHistory } from "react-router";
import { useSnackbar } from "notistack";
import DataEntryTable from "./DataEntryTable";
import { DataEntryRow } from "../utils/typings";
import ConfirmModal from "../utils/components/ConfirmModal";
import { createEmptyRows } from "../utils/functions";

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
    const history = useHistory();
    const [data, setData] = useState<DataEntryRow[]>(createEmptyRows(3));
    const [open, setOpen] = useState(false);
    const { enqueueSnackbar } = useSnackbar();

    useEffect(() => {
        document.title = "Add Participants | ST2020";
    }, []);

    async function handleSubmit() {
        const response = await fetch("/api/_bulk", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        });

        if (response.ok) {
            const responseData: Array<any> = await response.json();
            enqueueSnackbar(`${responseData.length} participants successfully added.`, {
                variant: "success",
            });
            history.push("/datasets");
        } else {
            const message = `Error: ${response.status} - ${
                response.statusText
            } "${await response.text()}"`;
            enqueueSnackbar(message, { variant: "error" });
        }
    }

    return (
        <main className={classes.content}>
            <div className={classes.appBarSpacer} />
            <Container className={classes.container} maxWidth={false}>
                <DataEntryTable data={data} onChange={setData} />
            </Container>
            <Container className={classes.buttonContainer} maxWidth={false}>
                <Button
                    className={classes.submitButton}
                    variant="contained"
                    color="primary"
                    size="large"
                    endIcon={<CloudUpload />}
                    onClick={() => setOpen(true)}
                >
                    Submit
                </Button>
            </Container>
            <ConfirmModal
                id="confirm-submit-modal"
                open={open}
                title="Confirm metadata submission"
                onClose={() => setOpen(false)}
                onConfirm={() => {
                    setOpen(false);
                    handleSubmit();
                }}
            >
                Are you sure that you would like to submit?
            </ConfirmModal>
        </main>
    );
}
