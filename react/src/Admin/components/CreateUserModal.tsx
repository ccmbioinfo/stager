import React, { useState } from "react";
import {
    Button,
    Checkbox,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    FormControlLabel,
    TextField,
    makeStyles,
} from "@material-ui/core";
import { NewUser } from "../../typings";

export interface CreateUserModalProps {
    id: string;
    open: boolean;
    onClose: () => void;
    onSuccess: (state: NewUser) => void;
}

const useStyles = makeStyles(theme => ({
    submitting: {
        cursor: "wait",
    },
}));

function ErrorText(props: { id: string; errorCode: number }) {
    switch (props.errorCode) {
        case 0:
            return <></>;
        case 404:
            return (
                <DialogContentText id={props.id} color="secondary">
                    Some requested permission groups do not exist.
                </DialogContentText>
            );
        case 422:
            return (
                <DialogContentText id={props.id} color="secondary">
                    Username or email already in use.
                </DialogContentText>
            );
        default:
            // 500 and the 400s and 415s that shouldn't happen
            return (
                <DialogContentText id={props.id} color="secondary">
                    Something went wrong. Please try again later.
                </DialogContentText>
            );
    }
}
// TODO: add group picker
export default function CreateUserModal(props: CreateUserModalProps) {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [isAdmin, setAdmin] = useState(false);
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [errorCode, setErrorCode] = useState(0);

    async function submit(e: React.FormEvent) {
        setSubmitting(true);
        e.preventDefault();
        const response = await fetch("/api/users", {
            method: "POST",
            credentials: "same-origin",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                username,
                email,
                is_admin: isAdmin,
                password,
            }),
        });
        if (response.ok) {
            props.onSuccess(await response.json());
            // Reset to default
            setUsername("");
            setEmail("");
            setAdmin(false);
            setPassword("");
            setConfirmPassword("");
            setErrorCode(0);
        } else {
            setErrorCode(response.status);
        }
        setSubmitting(false);
    }

    const passwordsDiffer = password !== confirmPassword;
    const passwordErrorText = passwordsDiffer && "Passwords do not match.";
    const submittable = !submitting && username && email && password && !passwordsDiffer;

    const classes = useStyles();

    return (
        <Dialog
            open={props.open}
            onClose={props.onClose}
            aria-labelledby={`${props.id}-title`}
            aria-describedby={`${props.id}-description`}
            PaperProps={{ component: "form" }}
            className={submitting ? classes.submitting : ""}
        >
            <DialogTitle id={`${props.id}-title`}>New user</DialogTitle>
            <DialogContent>
                <ErrorText id={`${props.id}-description`} errorCode={errorCode} />
                <TextField
                    required
                    autoFocus
                    autoComplete="off"
                    fullWidth
                    margin="dense"
                    variant="filled"
                    label="Username"
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
                    label="Password"
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    error={passwordsDiffer}
                    helperText={passwordErrorText}
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
                    error={passwordsDiffer}
                    helperText={passwordErrorText}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={props.onClose} color="default" variant="outlined">
                    Cancel
                </Button>
                <Button
                    type="submit"
                    onClick={submit}
                    disabled={!submittable}
                    color="primary"
                    variant="contained"
                >
                    Create
                </Button>
            </DialogActions>
        </Dialog>
    );
}
