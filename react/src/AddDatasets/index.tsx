import React, { useEffect, useState } from "react";
import { Button, Container, makeStyles, Tooltip } from "@material-ui/core";
import { CloudUpload } from "@material-ui/icons";
import { useSnackbar } from "notistack";
import { useHistory } from "react-router";
import { ConfirmModal } from "../components";
import { useUserContext } from "../contexts";
import { createEmptyRows, getDataEntryHeaders, strIsEmpty } from "../functions";
import { useBulkCreateMutation } from "../hooks";
import { DataEntryRow, DataEntryRowBase } from "../typings";
import DataEntryTable from "./components/DataEntryTable";
import { participantColumns } from "./components/utils";

const useStyles = makeStyles(theme => ({
    appBarSpacer: theme.mixins.toolbar,
    content: {
        flexGrow: 1,
        height: "100vh",
        overflow: "auto",
    },
    container: {
        marginTop: theme.spacing(3),
        marginBottom: theme.spacing(1),
    },
    buttonContainer: {
        padding: theme.spacing(1),
        display: "flex",
    },
    submitButton: {
        flexGrow: 1,
    },
}));

export default function AddParticipants() {
    const classes = useStyles();
    const history = useHistory();
    const { user: currentUser } = useUserContext();
    const datasetsMutation = useBulkCreateMutation();
    const [data, setData] = useState<DataEntryRow[]>([]);
    const [open, setOpen] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [asGroups, setAsGroups] = useState<string[]>([]); // "submitting as these groups"
    const { enqueueSnackbar } = useSnackbar();

    useEffect(() => {
        document.title = `Add Datasets | ${process.env.REACT_APP_NAME}`;
        const savedProgress = sessionStorage.getItem("add-datasets-progress");
        if (savedProgress !== null) {
            const savedData = JSON.parse(savedProgress) as DataEntryRow[];
            setData(savedData);
        } else {
            setData(createEmptyRows(1));
        }
    }, []);

    useEffect(() => {
        sessionStorage.setItem("add-datasets-progress", JSON.stringify(data));
    }, [data]);

    useEffect(() => {
        if (currentUser.groups.length === 1) {
            setAsGroups(currentUser.groups);
        }
    }, [currentUser]);

    function onChangeGroups(newGroups: string[]) {
        setAsGroups(newGroups);
    }

    // Check for error state
    useEffect(() => {
        // Check all permission groups
        if (currentUser.groups.length === 0) {
            setErrorMessage("Cannot submit. You are not part of any permission groups.");
            return;
        }

        // Check selected permission groups
        if (asGroups.length === 0) {
            setErrorMessage("Cannot submit. You must select a permission group.");
            return;
        }

        // Check required fields for all rows
        const headers = getDataEntryHeaders();
        let problemRows = new Map<number, Array<keyof DataEntryRowBase>>();

        for (let i = 0; i < data.length; i++) {
            let row = data[i];
            for (const field of headers.required) {
                // Condition for a row being 'problematic'

                // required rows that are pre-filled are allowed to be wrong
                if (row.participantColDisabled && (participantColumns as string[]).includes(field))
                    continue;

                if (strIsEmpty(row[field])) {
                    if (problemRows.get(i)) problemRows.set(i, problemRows.get(i)!.concat(field));
                    else problemRows.set(i, [field]);
                }
            }
        }

        if (problemRows.size > 0) {
            let message = "Cannot submit. Required fields missing for rows:";
            problemRows.forEach((fields, key) => {
                const fieldStr = fields.join(", ");
                message += `\n${key + 1}: (${fieldStr})`;
            });
            setErrorMessage(message);
            return;
        }

        // Checked everything, no problems
        setErrorMessage("");
    }, [data, asGroups, currentUser]);

    function handleSubmit() {
        datasetsMutation.mutate(
            { data: data, asGroups: asGroups },
            {
                onSuccess: datasets => {
                    const length = datasets.length;
                    enqueueSnackbar(
                        `${length} ${length !== 1 ? "datasets" : "dataset"} successfully added.`,
                        {
                            variant: "success",
                        }
                    );
                    setData(createEmptyRows(1));
                    history.push("/datasets");
                },
                onError: async response => {
                    const message = `Error: ${response.status} - ${
                        response.statusText
                    } "${await response.text()}"`;
                    enqueueSnackbar(message, { variant: "error" });
                },
            }
        );
    }

    function handleDataChange(newData: DataEntryRow[]) {
        setData(newData);
    }

    return (
        <main className={classes.content}>
            <div className={classes.appBarSpacer} />
            <Container className={classes.container} maxWidth={false}>
                <DataEntryTable
                    data={data}
                    onChange={handleDataChange}
                    allGroups={currentUser.groups}
                    groups={asGroups}
                    setGroups={onChangeGroups}
                />
            </Container>
            <Tooltip title={errorMessage} interactive>
                <Container className={classes.buttonContainer} maxWidth="sm">
                    <Button
                        disabled={!!errorMessage}
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
            </Tooltip>

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
