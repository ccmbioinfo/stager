import React, { useEffect, useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';

import UserRow, { UserRowState } from "./UserRow";

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
    const [messageVariant, setMessageVariant] = useState("secondary");

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
