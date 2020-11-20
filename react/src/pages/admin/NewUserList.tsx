import React, { useEffect, useReducer } from "react";
import {
    Box,
    Grid,
    IconButton,
    makeStyles,
    Paper,
    Toolbar,
    Tooltip,
    Typography,
} from "@material-ui/core";
import { PersonAdd } from "@material-ui/icons";
import { User, UserAction } from "../utils/typings";
import UserRow from "./NewUserRow";
import { useSnackbar } from "notistack";

async function updateUser(user: User) {
    return fetch("/api/users", {
        method: "PUT",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(user),
    });
}

async function deleteUser(user: User) {
    return fetch("/api/users", {
        method: "DELETE",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(user),
    });
}

const useStyles = makeStyles(theme => ({
    toolbar: {
        marginBottom: theme.spacing(1),
    },
    grow: {
        flexGrow: 1,
    },
}));

// Use a reducer for state management to handle update, add, delete
function reducer(state: User[], action: UserAction) {
    switch (action.type) {
        case "set":
            // Sets the state; only to be used when fetching data
            if (Array.isArray(action.payload)) return action.payload;
            return [action.payload];
        case "update":
            // Update the user with this username.
            const newUser = action.payload as User;
            return state.map(user =>
                user.username === newUser.username ? { ...user, ...newUser } : user
            );
        case "add":
            return state.concat(action.payload);
        case "delete":
            return state.filter(user => user.username === (action.payload as User).username);
        default:
            console.error(`Invalid action: ${action}`);
            return state;
    }
}

export default function UserList() {
    const classes = useStyles();
    const [users, dispatch] = useReducer(reducer, []);
    const { enqueueSnackbar } = useSnackbar();

    useEffect(() => {
        document.title = "Admin | ST2020";
        fetch("/api/users")
            .then(response => response.json())
            .then(data =>
                dispatch({
                    type: "set",
                    payload: data,
                })
            ); // No safety check on JSON structure
    }, []);

    return (
        <>
            <Toolbar component={Paper} className={classes.toolbar}>
                <Typography variant="h6">Users</Typography>
                <Box className={classes.grow} />
                <Tooltip title="Add new user">
                    <IconButton>
                        <PersonAdd />
                    </IconButton>
                </Tooltip>
            </Toolbar>
            <Grid container spacing={1} alignItems="flex-start">
                {users.map(user => (
                    <>
                        <UserRow
                            user={user}
                            onSave={user => {
                                updateUser(user)
                                    .then(async response => {
                                        const message = await response.text();
                                        enqueueSnackbar(
                                            `User updated successfully - ${response.status} ${message}`,
                                            { variant: "success" }
                                        );
                                        dispatch({ type: "update", payload: user });
                                    })
                                    .catch(async response => {
                                        const message = await response.text();
                                        enqueueSnackbar(
                                            `User update failed - ${response.status} ${message}`,
                                            { variant: "error" }
                                        );
                                    });
                            }}
                        />
                    </>
                ))}
            </Grid>
        </>
    );
}
