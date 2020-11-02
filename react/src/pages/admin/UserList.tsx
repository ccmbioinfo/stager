import React, { useEffect, useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import Button from "@material-ui/core/Button";
import Grid from "@material-ui/core/Grid";
import Snackbar, { SnackbarProps } from "@material-ui/core/Snackbar";
import AddIcon from "@material-ui/icons/Add";

import UserRow, { UserRowState } from "./UserRow";
import ConfirmModal from "./ConfirmModal";
import CreateUserModal, { CreateUser } from "./CreateUserModal";

const useStyles = makeStyles(theme => ({
    root: {
        flexGrow: 1,
        padding: theme.spacing(2),
        overflow: "auto",
    },
    addButton: {
        marginBottom: theme.spacing(1),
    },
}));

export default function UserList() {
    const [userList, setUserList] = useState<UserRowState[]>([]);
    const [addingUser, setAddingUser] = useState(false);
    const [updatingUser, setUpdatingUser] = useState<UserRowState | null>(null);
    const [deletingUser, setDeletingUser] = useState<UserRowState | null>(null);
    const [message, setMessage] = useState("");
    const [messageColor, setMessageColor] = useState<SnackbarProps["color"]>("secondary");

    async function addUserSuccess(user: CreateUser) {
        setUserList(userList.concat(user));
        setAddingUser(false);
    }

    async function updateUser() {
        const response = await fetch("/api/users", {
            method: "PUT",
            credentials: "same-origin",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updatingUser),
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
            body: JSON.stringify(deletingUser),
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
            <CreateUserModal
                id="create-modal"
                open={addingUser}
                onClose={() => setAddingUser(false)}
                onSuccess={addUserSuccess}
            />
            <ConfirmModal
                id="confirm-modal-update"
                color="primary"
                open={!!updatingUser}
                onClose={() => setUpdatingUser(null)}
                onConfirm={updateUser}
                title="Confirm updating user"
            >
                Update {updatingUser && updatingUser.username} and maybe overwrite password?
            </ConfirmModal>
            <ConfirmModal
                id="confirm-modal-delete"
                color="secondary"
                open={!!deletingUser}
                onClose={() => setDeletingUser(null)}
                onConfirm={deleteUser}
                title="Delete user"
            >
                Really delete {deletingUser && deletingUser.username}?
            </ConfirmModal>
            <Snackbar
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
                open={!!message}
                onClose={() => setMessage("")}
                message={message}
                color={messageColor}
            />
            <Button
                variant="contained"
                color="primary"
                className={classes.addButton}
                onClick={() => setAddingUser(true)}
            >
                <AddIcon />
                Add new
            </Button>
            <Grid container spacing={2}>
                {userList.map(user => (
                    <Grid item xs={12} md={6}>
                        <UserRow
                            key={user.username}
                            {...user}
                            onUpdate={setUpdatingUser}
                            onDelete={setDeletingUser}
                        />
                    </Grid>
                ))}
            </Grid>
        </main>
    );
}
