import React, { useState } from "react";
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    TextField,
    makeStyles,
    Typography,
} from "@material-ui/core";
import { useSnackbar } from "notistack";
import { Group } from "../../typings";

const useStyles = makeStyles(theme => ({
    submitting: {
        cursor: "wait",
    },
}));

interface CreateGroupModalProps {
    open: boolean;
    onClose: () => void;
}

const emptyGroup = { group_code: "", group_name: "" };

export default function CreateGroupModal(props: CreateGroupModalProps) {
    const classes = useStyles();
    const [group, setGroup] = useState<Group>(emptyGroup);
    const [submitting, setSubmitting] = useState(false);
    const [errorText, setErrorText] = useState<string>("");
    const { enqueueSnackbar } = useSnackbar();

    function onClose() {
        setGroup(emptyGroup);
        setErrorText("");
        props.onClose();
    }

    async function submit(e: React.FormEvent) {
        setSubmitting(true);
        e.preventDefault();
        const response = await fetch("/api/groups", {
            method: "POST",
            credentials: "same-origin",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...group, group_code: group.group_code.toLowerCase() }),
        });
        if (response.ok) {
            const responseData: Group = await response.json();
            enqueueSnackbar(`Group ${responseData.group_name} created successfully.`, {
                variant: "success",
            });
            onClose();
        } else {
            setErrorText(await response.text());
        }
        setSubmitting(false);
    }

    return (
        <Dialog
            open={props.open}
            onClose={onClose}
            fullWidth
            maxWidth="xs"
            className={submitting ? classes.submitting : ""}
        >
            <DialogTitle>New group</DialogTitle>
            <DialogContent>
                {errorText === "" ? <></> : <Typography color="secondary">{errorText}</Typography>}
                <TextField
                    required
                    label="Group name"
                    fullWidth
                    margin="dense"
                    variant="filled"
                    onChange={e => setGroup({ ...group, group_name: e.target.value })}
                    error={group.group_name === ""}
                    helperText={group.group_name === "" ? "This field cannot be empty." : ""}
                />
                <TextField
                    required
                    label="Group code"
                    fullWidth
                    margin="dense"
                    variant="filled"
                    onChange={e => setGroup({ ...group, group_code: e.target.value })}
                    error={group.group_code === ""}
                    helperText={group.group_code === "" ? "This field cannot be empty." : ""}
                />
            </DialogContent>
            <DialogActions>
                <Button color="default" variant="outlined" onClick={onClose}>
                    Cancel
                </Button>
                <Button
                    type="submit"
                    color="primary"
                    variant="contained"
                    disabled={group.group_code === "" || group.group_name === "" || submitting}
                    onClick={submit}
                >
                    Create
                </Button>
            </DialogActions>
        </Dialog>
    );
}
