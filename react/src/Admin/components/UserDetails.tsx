import React, { useReducer, useState } from "react";
import {
    Box,
    Button,
    ButtonGroup,
    Checkbox,
    FormControlLabel,
    Grid,
    makeStyles,
    Toolbar,
} from "@material-ui/core";
import { Delete } from "@material-ui/icons";
import { useSnackbar } from "notistack";
import { User, ConfirmPasswordAction } from "../../typings";
import { NewPasswordForm, ConfirmModal, MinioResetButton, MinioKeyDisplay } from "../../components";
import GroupSelect from "./GroupSelect";
import { useGroupsQuery, useUserQuery } from "../../hooks";
import { useUserContext } from "../../contexts";

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

type CombinedActions = ConfirmPasswordAction | UserAction | GroupAction;

function reducer(state: User, action: CombinedActions) {
    switch (action.type) {
        case "password":
            return { ...state, password: action.payload };
        case "confirm":
            return { ...state, confirmPassword: action.payload };
        case "set":
            return { ...action.payload };
        case "group":
            return { ...state, groups: action.payload };
        default:
            return state;
    }
}

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
    const groupsResult = useGroupsQuery();
    const { user: currentUser } = useUserContext();
    const groups = groupsResult.data;
    const userResult = useUserQuery(props.user.username);
    const user = userResult.data;
    const loading = userResult.isLoading;
    // Local changes saved in newState, and are "committed" when user saves changes
    const oldState = {
        ...props.user,
        password: "",
        confirmPassword: "",
    };
    const [newState, dispatch] = useReducer(reducer, null, () => oldState);

    const [confirmDelete, setConfirmDelete] = useState(false);
    const [confirmSave, setConfirmSave] = useState(false);

    const { enqueueSnackbar } = useSnackbar();

    const disableDelete = currentUser.username === props.user.username;

    function onCancelChanges() {
        dispatch({ type: "set", payload: oldState });
        enqueueSnackbar("User changes reverted to original state");
    }

    function onSave() {
        props.onSave(newState);
    }

    return (
        <>
            <ConfirmModal
                id="confirm-modal-update"
                open={confirmSave}
                onClose={() => setConfirmSave(false)}
                onConfirm={() => {
                    onSave();
                    setConfirmSave(false);
                }}
                title="Confirm updating user"
            >
                Are you sure you want to save changes to user {oldState.username}?
            </ConfirmModal>
            <ConfirmModal
                id="confirm-modal-delete"
                open={confirmDelete}
                onClose={() => setConfirmDelete(false)}
                onConfirm={() => {
                    if (!disableDelete) props.onDelete(oldState);
                }}
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
                                label={<b>Deactivated</b>}
                                control={
                                    <Checkbox
                                        checked={newState.deactivated}
                                        color="primary"
                                        onChange={e =>
                                            dispatch({
                                                type: "set",
                                                payload: {
                                                    ...newState,
                                                    deactivated: e.target.checked,
                                                },
                                            })
                                        }
                                    />
                                }
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <FormControlLabel
                                label={<b>Admin</b>}
                                control={
                                    <Checkbox
                                        checked={newState.is_admin}
                                        color="primary"
                                        onChange={e =>
                                            dispatch({
                                                type: "set",
                                                payload: {
                                                    ...newState,
                                                    is_admin: e.target.checked,
                                                },
                                            })
                                        }
                                    />
                                }
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <MinioKeyDisplay
                                loading={loading}
                                minio_access_key={user?.minio_access_key}
                                minio_secret_key={user?.minio_secret_key}
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
                        <GroupSelect
                            groups={groups}
                            selected={newState.groups}
                            onSelectionChange={selection =>
                                dispatch({ type: "group", payload: selection })
                            }
                        />
                    </Grid>
                </Grid>
                <Toolbar className={classes.toolbar}>
                    <MinioResetButton username={props.user.username} className={classes.button} />
                    <Button
                        color="secondary"
                        variant="contained"
                        startIcon={<Delete />}
                        className={classes.button}
                        onClick={() => {
                            if (!disableDelete) setConfirmDelete(true);
                        }}
                        disabled={disableDelete}
                    >
                        Delete
                    </Button>
                    <div className={classes.grow} />
                    <ButtonGroup>
                        <Button variant="contained" onClick={onCancelChanges}>
                            Cancel
                        </Button>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={() => setConfirmSave(true)}
                            disabled={newState.password !== newState.confirmPassword}
                        >
                            Save Changes
                        </Button>
                    </ButtonGroup>
                </Toolbar>
            </Box>
        </>
    );
}
