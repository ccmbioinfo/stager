import React, { useState } from "react";
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    TextField,
} from "@material-ui/core";
import { useSnackbar } from "notistack";
import { Group } from "../../typings";

interface CreateGroupModalProps {
    open: boolean;
    onClose: () => void;
}

export default function CreateGroupModal(props: CreateGroupModalProps) {
    const emptyGroup = { group_code: "", group_name: "" };
    const [group, setGroup] = useState<Group>(emptyGroup);
    const { enqueueSnackbar } = useSnackbar();

    function onClose() {
        setGroup(emptyGroup);
        props.onClose();
    }

    async function submit(e: React.FormEvent) {
        e.preventDefault();

        const response = await fetch("/api/groups", {
            method: "POST",
            credentials: "same-origin",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(group),
        });
        if (response.ok) {
            const responseData: Group = await response.json();
            enqueueSnackbar(`Group ${responseData.group_name} created successfully.`, {
                variant: "success",
            });
        } else {
            enqueueSnackbar(
                `Failed to create ${group.group_name}. Error: ${response.status} - ${response.statusText}`,
                { variant: "error" }
            );
        }
        onClose();
    }

    return (
        <Dialog open={props.open} onClose={onClose} fullWidth maxWidth="xs">
            <DialogTitle>New group</DialogTitle>
            <DialogContent>
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
                <Button type="submit" color="primary" variant="contained" onClick={submit}>
                    Create
                </Button>
            </DialogActions>
        </Dialog>
    );
}