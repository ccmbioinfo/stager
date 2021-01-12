import React, { useEffect, useReducer, useState } from "react";
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
import { Group, NewUser } from "../../typings";
import GroupSelect from "./GroupSelect";
import { useFetchCache } from "../../contexts/fetchCache";

interface CreateUserState {
    username: string;
    email: string;
    is_admin: boolean;
    password: string;
    confirmPassword: string;
    groups: string[];
}

const initState = {
    username: "",
    email: "",
    is_admin: false,
    password: "",
    confirmPassword: "",
    groups: [],
};

type SetAction = { type: "set" } & Partial<CreateUserState>;
type ResetAction = { type: "reset" };

function reducer(state: CreateUserState, action: SetAction | ResetAction): CreateUserState {
    switch (action.type) {
        case "set":
            const { type, ...payload } = action;
            return { ...state, ...payload };
        case "reset":
            return initState;
        default:
            return state;
    }
}

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

interface ErrorTextProps {
    id: string;
    errorCode: number;
    details: { error: string; message: string };
}

function ErrorText(props: ErrorTextProps) {
    switch (props.errorCode) {
        case 0:
            return <></>;
        case 400:
            return (
                <DialogContentText id={props.id} color="secondary">
                    Username or email too long, bad email, or other invalid input.
                </DialogContentText>
            );
        case 404:
            return (
                <DialogContentText id={props.id} color="secondary">
                    Some requested permission groups do not exist.
                </DialogContentText>
            );
        case 422:
            return (
                <DialogContentText id={props.id} color="secondary">
                    {props.details.message}
                </DialogContentText>
            );
        default:
            // 500 and the 415s that shouldn't happen
            return (
                <DialogContentText id={props.id} color="secondary">
                    Something went wrong. Please try again later.
                </DialogContentText>
            );
    }
}

export default function CreateUserModal(props: CreateUserModalProps) {
    const [state, dispatch] = useReducer(reducer, initState);
    const [submitting, setSubmitting] = useState(false);
    const [errorCode, setErrorCode] = useState(0);
    const [errorDetails, setErrorDetails] = useState({ error: "", message: "" });
    const groups = (useFetchCache("/api/groups") || []) as Group[];

    // Reset on open/close as side effect
    useEffect(() => {
        dispatch({ type: "reset" });
        setErrorCode(0);
    }, [props.open]);

    async function submit(e: React.FormEvent) {
        setSubmitting(true);
        e.preventDefault();
        const { confirmPassword, ...user } = state;
        const response = await fetch("/api/users", {
            method: "POST",
            credentials: "same-origin",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(user),
        });
        if (response.ok) {
            props.onSuccess(await response.json());
        } else {
            setErrorCode(response.status);
        }
        if (response.status === 422) {
            setErrorDetails(await response.json());
        } else {
            setErrorDetails({ error: "", message: "" });
        }
        setSubmitting(false);
    }

    const passwordsDiffer = state.password !== state.confirmPassword;
    const passwordErrorText = passwordsDiffer && "Passwords do not match.";
    const submittable =
        !submitting && state.username && state.email && state.password && !passwordsDiffer;

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
                <ErrorText
                    id={`${props.id}-description`}
                    errorCode={errorCode}
                    details={errorDetails}
                />
                <TextField
                    required
                    autoFocus
                    autoComplete="off"
                    fullWidth
                    margin="dense"
                    variant="filled"
                    label="Username"
                    value={state.username}
                    onChange={e => dispatch({ type: "set", username: e.target.value })}
                />
                <TextField
                    required
                    autoComplete="off"
                    fullWidth
                    margin="dense"
                    variant="filled"
                    label="Email"
                    type="email"
                    value={state.email}
                    onChange={e => dispatch({ type: "set", email: e.target.value })}
                />
                <FormControlLabel
                    label="Admin?"
                    control={
                        <Checkbox
                            checked={state.is_admin}
                            onChange={e => dispatch({ type: "set", is_admin: e.target.checked })}
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
                    value={state.password}
                    onChange={e => dispatch({ type: "set", password: e.target.value })}
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
                    value={state.confirmPassword}
                    onChange={e => dispatch({ type: "set", confirmPassword: e.target.value })}
                    error={passwordsDiffer}
                    helperText={passwordErrorText}
                />
                <GroupSelect
                    groups={groups}
                    selected={state.groups}
                    onSelectionChange={selectedGroups =>
                        dispatch({ type: "set", groups: selectedGroups })
                    }
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
