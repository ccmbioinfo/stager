import React, { useEffect, useState } from "react";
import {
    Box,
    Grid,
    IconButton,
    List,
    makeStyles,
    Paper,
    Toolbar,
    Tooltip,
    Typography,
} from "@material-ui/core";
import { PersonAdd } from "@material-ui/icons";
import { useSnackbar } from "notistack";
import { useErrorSnackbar, useUsersDeleteMutation, useUsersQuery, useUsersUpdateMutation } from "../../hooks";
import CreateUserModal from "./CreateUserModal";
import UserRow from "./UserRow";

const useStyles = makeStyles(theme => ({
    toolbar: {
        marginBottom: theme.spacing(1),
    },
    grow: {
        flexGrow: 1,
    },
}));

export default function UserList() {
    const classes = useStyles();
    const { data: users } = useUsersQuery();
    const userUpdateMutation = useUsersUpdateMutation();
    const userDeleteMutation = useUsersDeleteMutation();
    const [openNewUser, setOpenNewUser] = useState(false);
    const { enqueueSnackbar } = useSnackbar();
    const enqueueErrorSnackbar = useErrorSnackbar();

    useEffect(() => {
        document.title = `Admin | ${process.env.REACT_APP_NAME}`;
    }, []);

    return (
        <>
            <CreateUserModal
                id="create-modal"
                open={openNewUser}
                onClose={() => setOpenNewUser(false)}
                onSuccess={() => {
                    setOpenNewUser(false);
                }}
            />
            <Toolbar component={Paper} className={classes.toolbar}>
                <Typography variant="h6">Users</Typography>
                <Box className={classes.grow} />
                <Tooltip title="Add new user">
                    <IconButton onClick={() => setOpenNewUser(true)}>
                        <PersonAdd />
                    </IconButton>
                </Tooltip>
            </Toolbar>
            <List>
                <Grid container spacing={1} alignItems="flex-start">
                    {users &&
                        users.map(user => (
                            <UserRow
                                key={user.username}
                                user={user}
                                onSave={newUser => {
                                    userUpdateMutation.mutate(newUser, {
                                        onSuccess: user => {
                                            enqueueSnackbar(
                                                `User ${user.username} updated successfully`,
                                                { variant: "success" }
                                            );
                                        },
                                        onError: async response => {
                                            enqueueErrorSnackbar(response, `User ${newUser.username} update failed.`)
                                        },
                                    });
                                }}
                                onDelete={newUser => {
                                    userDeleteMutation.mutate(newUser.username, {
                                        onSuccess: message => {
                                            enqueueSnackbar(
                                                `User ${newUser.username} deleted successfully`,
                                                { variant: "success" }
                                            );
                                        },
                                        onError: async response => {
                                            enqueueErrorSnackbar(response, `User ${newUser.username} deletion failed.`);
                                        },
                                    });
                                }}
                            />
                        ))}
                </Grid>
            </List>
        </>
    );
}
