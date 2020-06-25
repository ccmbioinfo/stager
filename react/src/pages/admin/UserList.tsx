import React, { useEffect, useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Grid from '@material-ui/core/Grid';
import Snackbar, { SnackbarProps } from '@material-ui/core/Snackbar';
import Typography from '@material-ui/core/Typography';

import UserRow, { UserRowState } from "./UserRow";
import ConfirmModal from './ConfirmModal';

const useStyles = makeStyles(theme => ({
    root: {
        flexGrow: 1
    },
    appBarSpacer: theme.mixins.toolbar,
    table: {
        padding: theme.spacing(2)
    }
}));

export default function UserList() {
    const [userList, setUserList] = useState<UserRowState[]>([]);
    const [addingUser, setAddingUser] = useState(false);
    const [updatingUser, setUpdatingUser] = useState<UserRowState | null>(null);
    const [deletingUser, setDeletingUser] = useState<UserRowState | null>(null);
    const [message, setMessage] = useState("");
    const [messageColor, setMessageColor] = useState<SnackbarProps["color"]>("secondary");

    async function updateUser() {
        const response = await fetch("/api/users", {
            method: "PUT",
            credentials: "same-origin",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updatingUser)
        });
        if (response.ok) {
            setMessage(`Updated ${updatingUser!.username}.`);
            setMessageColor("primary");
        } else {
            setMessage(`Bad request for ${updatingUser!.username}.`);
            setMessageColor("secondary");
        }
        setUpdatingUser(null);
    }

    async function deleteUser() {
        const response = await fetch("/api/users", {
            method: "DELETE",
            credentials: "same-origin",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(deletingUser)
        });
        if (response.ok) {
            // Precondition: deletingUser is in userList
            setUserList(userList.filter(user => user.username !== deletingUser!.username));
            setMessage(`Deleted ${deletingUser!.username}.`);
            setMessageColor("primary");
        } else {
            setMessage(`Failed to delete ${deletingUser!.username}.`);
            setMessageColor("secondary");
        }
        setDeletingUser(null);
    }

    useEffect(() => {
        document.title = "Admin | ST2020";
        fetch("/api/users")
            .then(response => response.json())
            .then(setUserList); // No safety check on JSON structure
    }, []);

    const classes = useStyles();

    return (
        <main className={classes.root}>
            <div className={classes.appBarSpacer} />
            <ConfirmModal id="confirm-modal-update" color="primary"
                open={!!updatingUser}
                onClose={() => setUpdatingUser(null)}
                onConfirm={updateUser}
                title="Confirm updating user">
                Update {updatingUser && updatingUser.username} and maybe overwrite password?
            </ConfirmModal>
            <ConfirmModal id="confirm-modal-delete" color="secondary"
                open={!!deletingUser}
                onClose={() => setDeletingUser(null)}
                onConfirm={deleteUser}
                title="Delete user">
                Really delete {deletingUser && deletingUser.username}?
            </ConfirmModal>
            <Snackbar
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                open={!!message}
                onClose={() => setMessage("")}
                message={message}
                color={messageColor}
            />
            <Grid container className={classes.table}>
                <Grid item xs={4}>
                    <Typography variant="h6">Username &amp; email</Typography>
                </Grid>
                <Grid item xs={1}>
                    <Typography variant="h6">Admin?</Typography>
                </Grid>
                <Grid item xs={6}>
                    <Typography variant="h6">Change password</Typography>
                </Grid>
                <Grid item xs={1}>
                    <Typography variant="h6">Actions</Typography>
                </Grid>
                {userList.map(user =>
                    <UserRow
                        key={user.username} {...user}
                        onUpdate={setUpdatingUser}
                        onDelete={setDeletingUser} />
                )}
            </Grid>
        </main>
    );
}
