import React, { useState } from "react";
import Button from "@material-ui/core/Button";
import Checkbox from "@material-ui/core/Checkbox";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import TextField from "@material-ui/core/TextField";
import { User } from "../utils/typings";

export interface CreateUserModalProps {
    id: string;
    open: boolean;
    onClose: () => void;
    onSuccess: (state: User) => void;
}

export default function CreateUserModal(props: CreateUserModalProps) {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [isAdmin, setAdmin] = useState(false);
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    // The following two are mutually exclusive
    const [errorNoMatch, setErrorNoMatch] = useState(false);
    const [errorIntegrity, setErrorIntegrity] = useState(false);

    async function submit(e: React.FormEvent) {
        e.preventDefault();
        const state = { username, email, isAdmin, password, confirmPassword };
        const response = await fetch("/api/users", {
            method: "POST",
            credentials: "same-origin",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(state),
        });
        if (response.ok) {
            props.onSuccess(state);
            // Reset to default
            setUsername("");
            setEmail("");
            setAdmin(false);
            setPassword("");
            setConfirmPassword("");
            setErrorNoMatch(false);
            setErrorIntegrity(false);
        } else {
            setErrorNoMatch(response.status === 400);
            setErrorIntegrity(response.status !== 400);
        }
    }

    let errorFragment = <></>;
    if (errorNoMatch) {
        errorFragment = (
            <DialogContentText id={`${props.id}-description`} color="secondary">
                Passwords do not match or length requirement not satisfied.
            </DialogContentText>
        );
    } else if (errorIntegrity) {
        errorFragment = (
            <DialogContentText id={`${props.id}-description`} color="secondary">
                User or email already exists.
            </DialogContentText>
        );
    }

    return (
        <Dialog
            open={props.open}
            onClose={props.onClose}
            aria-labelledby={`${props.id}-title`}
            aria-describedby={`${props.id}-description`}
            PaperProps={{ component: "form" }}
        >
            <DialogTitle id={`${props.id}-title`}>New user</DialogTitle>
            <DialogContent>
                {errorFragment}
                <TextField
                    required
                    autoFocus
                    autoComplete="off"
                    fullWidth
                    margin="dense"
                    variant="filled"
                    label="Username (minimum 4 characters)"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                />
                <TextField
                    required
                    autoComplete="off"
                    fullWidth
                    margin="dense"
                    variant="filled"
                    label="Email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                />
                <FormControlLabel
                    label="Admin?"
                    control={
                        <Checkbox
                            checked={isAdmin}
                            onChange={e => setAdmin(e.target.checked)}
                            color="primary"
                        />
                    }
                />
                <TextField
                    required
                    autoComplete="new-password"
                    fullWidth
                    margin="dense"
                    variant="filled"
                    label="Password (minimum 4 characters)"
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                />
                <TextField
                    required
                    autoComplete="new-password"
                    fullWidth
                    margin="dense"
                    variant="filled"
                    label="Confirm password"
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={props.onClose} color="primary">
                    Cancel
                </Button>
                <Button type="submit" onClick={submit} color="primary" variant="contained">
                    Create
                </Button>
            </DialogActions>
        </Dialog>
    );
}
