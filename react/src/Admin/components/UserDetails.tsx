import { useEffect, useReducer, useState } from "react";
import {
    Box,
    Button,
    ButtonGroup,
    Checkbox,
    CircularProgress,
    FormControlLabel,
    Grid,
    makeStyles,
    TextField,
    Toolbar,
    Typography,
} from "@material-ui/core";
import { Delete } from "@material-ui/icons";
import { useSnackbar } from "notistack";
import {
    ConfirmModal,
    MinioKeyDisplay,
    MinioResetButton,
    NewPasswordForm,
    SecretDisplay,
} from "../../components";
import { useAPIInfoContext, useUserContext } from "../../contexts";
import {
    useErrorSnackbar,
    useGroupsQuery,
    useUserQuery,
    useUsersCreateClientMutation,
    useUsersDeleteMutation,
    useUsersUpdateMutation,
} from "../../hooks";
import { ConfirmPasswordAction, User } from "../../typings";
import GroupSelect from "./GroupSelect";

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
export default function UserDetails({ username }: { username: string }) {
    const { enqueueSnackbar } = useSnackbar();
    const enqueueErrorSnackbar = useErrorSnackbar();
    const userUpdateMutation = useUsersUpdateMutation();
    const userDeleteMutation = useUsersDeleteMutation();

    const classes = useDetailStyles();
    const groupsResult = useGroupsQuery();
    const { user: currentUser } = useUserContext();
    const apiInfo = useAPIInfoContext();
    const groups = groupsResult.data;
    /* we're fetching our user freshly to minimize display of private fields */
    const { data: user, isLoading } = useUserQuery(username);

    useEffect(() => {
        if (user) {
            dispatch({ type: "set", payload: user });
        }
    }, [user]);

    const [formState, dispatch] = useReducer(reducer, {} as User);

    const [confirmDelete, setConfirmDelete] = useState(false);
    const [confirmSave, setConfirmSave] = useState(false);

    const { mutate: createClient } = useUsersCreateClientMutation();

    const disableDelete = currentUser.username === username;

    function onCancelChanges() {
        dispatch({ type: "set", payload: user as User });
        enqueueSnackbar("User changes reverted to original state");
    }

    /* ensure that user has returned and form has been initialized before rendering view */
    return !!user && !!formState.username ? (
        <>
            <ConfirmModal
                id="confirm-modal-update"
                open={confirmSave}
                onClose={() => setConfirmSave(false)}
                onConfirm={() => {
                    userUpdateMutation.mutate(formState, {
                        onSuccess: user => {
                            enqueueSnackbar(`User ${user.username} updated successfully`, {
                                variant: "success",
                            });
                        },
                        onError: async response => {
                            enqueueErrorSnackbar(
                                response,
                                `User ${formState.username} update failed.`
                            );
                        },
                    });
                    setConfirmSave(false);
                }}
                title="Confirm updating user"
            >
                Are you sure you want to save changes to user {user.username}?
            </ConfirmModal>
            <ConfirmModal
                id="confirm-modal-delete"
                open={confirmDelete}
                onClose={() => setConfirmDelete(false)}
                onConfirm={() => {
                    if (!disableDelete) {
                        userDeleteMutation.mutate(username, {
                            onSuccess: () => {
                                enqueueSnackbar(`User ${username} deleted successfully`, {
                                    variant: "success",
                                });
                            },
                            onError: response =>
                                enqueueErrorSnackbar(response, `User ${username} deletion failed.`),
                        });
                    }
                }}
                title="Delete user"
                colors={{ cancel: "secondary" }}
            >
                Are you sure you want to delete user {user.username}?
            </ConfirmModal>
            <Box className={classes.root}>
                <Grid container spacing={1} alignItems="flex-start">
                    <Grid container item md={6} lg={12} spacing={2}>
                        <Grid item xs={6}>
                            <FormControlLabel
                                label={<b>Deactivated</b>}
                                control={
                                    <Checkbox
                                        checked={formState.deactivated}
                                        color="primary"
                                        onChange={e =>
                                            dispatch({
                                                type: "set",
                                                payload: {
                                                    ...formState,
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
                                        checked={formState.is_admin}
                                        color="primary"
                                        onChange={e =>
                                            dispatch({
                                                type: "set",
                                                payload: {
                                                    ...formState,
                                                    is_admin: e.target.checked,
                                                },
                                            })
                                        }
                                    />
                                }
                            />
                        </Grid>
                        <Grid item sm={6} xs={12}>
                            <MinioKeyDisplay
                                loading={isLoading}
                                minio_access_key={user?.minio_access_key}
                                minio_secret_key={user?.minio_secret_key}
                            />
                        </Grid>
                        <Grid item container sm={6} xs={12} direction="column">
                            {user?.client ? (
                                <Grid item container direction="column">
                                    <SecretDisplay
                                        title="Client ID"
                                        secret={user.client.client_id}
                                    />
                                    <SecretDisplay
                                        title="Client Secret"
                                        secret={user.client.client_secret}
                                    />
                                </Grid>
                            ) : (
                                <Grid item container direction="column" spacing={2}>
                                    <Grid item>
                                        <Typography color="error">
                                            No OAuth Client associated with this user!
                                        </Typography>
                                    </Grid>
                                    <Grid item>
                                        <Button
                                            variant="outlined"
                                            onClick={() => createClient(user)}
                                        >
                                            Create Client
                                        </Button>
                                    </Grid>
                                </Grid>
                            )}
                        </Grid>
                        {apiInfo?.oauth && (
                            <Grid item sm={6} xs={12}>
                                <Typography>
                                    <b>OAuth Fields</b>
                                </Typography>
                                <TextField
                                    variant="filled"
                                    fullWidth
                                    margin="dense"
                                    label="Issuer (OAuth Provider URL)"
                                    value={formState.issuer}
                                    onChange={e =>
                                        dispatch({
                                            type: "set",
                                            payload: { ...formState, issuer: e.target.value },
                                        })
                                    }
                                />
                                <TextField
                                    variant="filled"
                                    fullWidth
                                    margin="dense"
                                    label="Subject (OAuth User ID)"
                                    value={formState.subject}
                                    onChange={e =>
                                        dispatch({
                                            type: "set",
                                            payload: { ...formState, subject: e.target.value },
                                        })
                                    }
                                />
                            </Grid>
                        )}
                        <Grid item xs={12}>
                            <NewPasswordForm
                                passwords={{
                                    password: formState.password!,
                                    confirmPassword: formState.confirmPassword!,
                                }}
                                dispatch={dispatch}
                            />
                        </Grid>
                    </Grid>
                    <Grid item md={12} lg={6}>
                        <GroupSelect
                            groups={groups}
                            selected={formState.groups}
                            onSelectionChange={selection =>
                                dispatch({ type: "group", payload: selection })
                            }
                        />
                    </Grid>
                </Grid>
                <Toolbar className={classes.toolbar}>
                    <MinioResetButton username={user.username} className={classes.button} />
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
                            disabled={formState.password !== formState.confirmPassword}
                        >
                            Save Changes
                        </Button>
                    </ButtonGroup>
                </Toolbar>
            </Box>
        </>
    ) : (
        <CircularProgress />
    );
}
