import React, { useState } from "react";
import {
    Button,
    ButtonGroup,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    TextField,
} from "@material-ui/core";
import { Analysis } from "../../typings";

interface SetAssigneeDialogProps {
    affectedRows: Analysis[];
    open: boolean;
    onSubmit: (username: string) => void;
    onClose: () => void;
}

export default function SetAssigneeDialog(props: SetAssigneeDialogProps) {
    const [username, setUsername] = useState<string>("");
    // const [error, setError] = useState<boolean>(false);

    return (
        <Dialog
            open={props.open}
            onClose={props.onClose}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
        >
            <DialogTitle id="alert-dialog-title">Set Assignee</DialogTitle>
            <DialogContent>
                <DialogContentText id="alert-dialog-description">
                    Please enter the new assignee's username.
                </DialogContentText>
                <TextField
                    autoFocus
                    id="name"
                    label="Assignee Username"
                    type="text"
                    value={username}
                    onChange={event => setUsername(event.target.value)}
                    // error={error}
                    // helperText={error ? "Invalid username." : ""}
                />
            </DialogContent>
            <DialogActions>
                <ButtonGroup>
                    <Button onClick={props.onClose} color="default" variant="contained">
                        Cancel
                    </Button>
                    <Button
                        onClick={() => props.onSubmit(username)}
                        color="primary"
                        autoFocus
                        variant="contained"
                    >
                        Submit
                    </Button>
                </ButtonGroup>
            </DialogActions>
        </Dialog>
    );
}
