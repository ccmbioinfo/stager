import React, { useReducer, useState } from "react";
import { createHash } from "crypto";
import {
    Box,
    Button,
    ButtonGroup,
    Checkbox,
    FormControlLabel,
    Grid,
    makeStyles,
    Toolbar,
    Typography,
} from "@material-ui/core";
import { Delete } from "@material-ui/icons";
import { User } from "../utils/typings";
import SecretDisplay from "../utils/components/SecretDisplay";
import NewPasswordForm, { ConfirmPasswordAction } from "../utils/components/NewPasswordForm";
import ChipTransferList from "../utils/components/ChipTransferList";
import ConfirmModal from "../utils/components/ConfirmModal";

const useDetailStyles = makeStyles(theme => ({
    root: {
        margin: theme.spacing(1),
        padding: theme.spacing(2),
    },
    grow: {
        flexGrow: 1,
    },
    toolbar: {
        padding: 0,
    },
    button: {
        marginRight: theme.spacing(1),
    },
}));

interface UserAction {
    type: "set";
    payload: User;
}

interface GroupAction {
    type: "group";
    payload: string[];
}

function reducer(state: User, action: ConfirmPasswordAction | UserAction | GroupAction) {
    switch (action.type) {
        case "password":
            return { ...state, password: action.payload };
        case "confirm":
            return { ...state, confirmPassword: action.payload };
        case "set":
            return { ...action.payload };
        case "group":
            return { ...state, groupMemberships: action.payload };
        default:
            return state;
    }
}

// TODO: replace this with group list pulled from backend
const temporaryMagicGlobalGroupList = ["FOO", "BAR", "BAZ"];

/**
 * The collapsible part of a user row. A form for viewing
 * and editing credentials.
 */
export default function UserDetails(props: {
    user: User;
    onSave: (newUser: User) => void;
    onDelete: (deleteUser: User) => void;
}) {
    const classes = useDetailStyles();
    // Local changes saved in newState, and are "committed" when user saves changes
    const oldState = {
        ...props.user,
        password: "",
        confirmPassword: "",
        groupMemberships: ["FOO", "BAR"],
    } as User;
    const [newState, dispatch] = useReducer(reducer, oldState);

    const [confirmDelete, setConfirmDelete] = useState(false);
    const [confirmSave, setConfirmSave] = useState(false);

    return (
        <>
            <ConfirmModal
                id="confirm-modal-update"
                open={confirmSave}
                onClose={() => setConfirmSave(false)}
                onConfirm={() => props.onSave(newState)}
                title="Confirm updating user"
            >
                Are you sure you want to save changes to user {oldState.username}?
            </ConfirmModal>
            <ConfirmModal
                id="confirm-modal-delete"
                open={confirmDelete}
                onClose={() => setConfirmDelete(false)}
                onConfirm={() => props.onDelete(oldState)}
                title="Delete user"
                colors={{ cancel: "secondary" }}
            >
                Are you sure you want to delete user {oldState.username}?
            </ConfirmModal>
            <Box className={classes.root}>
                <Grid container spacing={1}>
                    <Grid container item md={12} lg={6} spacing={1}>
                        <Grid item xs={6}>
                            <FormControlLabel
                                disabled // TODO: Re-enable when you can deactivate users
                                label={<b>Active User</b>}
                                control={<Checkbox checked={true} color="primary" />}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <FormControlLabel
                                label={<b>Admin</b>}
                                control={
                                    <Checkbox
                                        checked={newState.isAdmin}
                                        color="primary"
                                        onChange={e =>
                                            dispatch({
                                                type: "set",
                                                payload: {
                                                    ...newState,
                                                    isAdmin: e.target.checked,
                                                },
                                            })
                                        }
                                    />
                                }
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <SecretDisplay
                                title="MinIO Access Key"
                                // TODO: Replace this with the actual secret
                                secret={createHash("md5").update(props.user.username).digest("hex")}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <SecretDisplay
                                title="MinIO Secret Key"
                                // TODO: Replace this with the actual secret
                                secret={createHash("md5").update(props.user.email).digest("hex")}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <NewPasswordForm
                                passwords={{
                                    password: newState.password!,
                                    confirmPassword: newState.confirmPassword!,
                                }}
                                dispatch={dispatch}
                            />
                        </Grid>
                    </Grid>
                    <Grid item md={12} lg={6}>
                        <Typography>
                            <b>Group Management</b>
                        </Typography>
                        <ChipTransferList
                            labels={temporaryMagicGlobalGroupList}
                            defaultSelected={newState.groupMemberships}
                            onSelectionChange={selectedLabels =>
                                dispatch({ type: "group", payload: selectedLabels })
                            }
                        />
                    </Grid>
                </Grid>
                <Toolbar className={classes.toolbar}>
                    <Button
                        color="secondary"
                        variant="contained"
                        className={classes.button}
                        disabled // TODO: Re-enable when resetting MinIO Creds is ready
                    >
                        Reset MinIO Credentials
                    </Button>
                    <Button
                        color="secondary"
                        variant="contained"
                        startIcon={<Delete />}
                        className={classes.button}
                        onClick={() => setConfirmDelete(true)}
                    >
                        Delete
                    </Button>
                    <div className={classes.grow} />
                    <ButtonGroup>
                        <Button
                            variant="contained"
                            onClick={() => {
                                dispatch({ type: "set", payload: oldState });
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={() => setConfirmSave(true)}
                        >
                            Save Changes
                        </Button>
                    </ButtonGroup>
                </Toolbar>
            </Box>
        </>
    );
}
