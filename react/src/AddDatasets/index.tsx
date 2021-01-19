import React, { useEffect, useState } from "react";
import { makeStyles, Container, Button, Tooltip } from "@material-ui/core";
import { CloudUpload } from "@material-ui/icons";
import { useHistory } from "react-router";
import { useSnackbar } from "notistack";
import DataEntryTable from "./components/DataEntryTable";
import { DataEntryRow, DataEntryRowBase } from "../typings";
import { ConfirmModal } from "../components";
import { createEmptyRows, getDataEntryHeaders, strIsEmpty } from "../functions";
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

export default function AddParticipants(props: {
    groups: string[]; // groups that the user is in
}) {
    const classes = useStyles();
    const history = useHistory();
    const [data, setData] = useState<DataEntryRow[]>([]);
    const [open, setOpen] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [asGroups, setAsGroups] = useState<string[]>([]); // "submitting as these groups"
    const { enqueueSnackbar } = useSnackbar();

    useEffect(() => {
        document.title = `Add Datasets | ${process.env.REACT_APP_NAME}`;
        handleDataChange(createEmptyRows(1)); // sets errorMessage on initial render
    }, []);

    useEffect(() => {
        if (props.groups.length > 0) {
            setAsGroups(props.groups);
        }
    }, [props.groups]);

    function onChangeGroups(newGroups: string[]) {
        setAsGroups(newGroups);
    }

    // Check for error state
    useEffect(() => {
        // Check all permission groups
        if (props.groups.length === 0) {
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
    }, [data, asGroups, props.groups]);

    async function handleSubmit() {
        const params = asGroups.length > 0 ? `?groups=${asGroups.join(",")}` : "";
        const response = await fetch("/api/_bulk" + params, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        });

        if (response.ok) {
            const responseData: Array<any> = await response.json();
            const length = responseData.length;
            enqueueSnackbar(
                `${length} ${length !== 1 ? "datasets" : "dataset"} successfully added.`,
                {
                    variant: "success",
                }
            );
            history.push("/datasets");
        } else {
            const message = `Error: ${response.status} - ${
                response.statusText
            } "${await response.text()}"`;
            enqueueSnackbar(message, { variant: "error" });
        }
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
                    allGroups={props.groups}
                    groups={asGroups}
                    setGroups={onChangeGroups}
                />
            </Container>
            <Tooltip title={errorMessage} interactive>
                <Container className={classes.buttonContainer} maxWidth={"sm"}>
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
