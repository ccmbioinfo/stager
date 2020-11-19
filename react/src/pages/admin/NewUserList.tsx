import React, { useEffect, useState } from "react";
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
import { User } from "../utils/typings";
import UserRow from "./NewUserRow";

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
    const [users, setUsers] = useState<User[]>([]);

    useEffect(() => {
        document.title = "Admin | ST2020";
        fetch("/api/users")
            .then(response => response.json())
            .then(setUsers); // No safety check on JSON structure
    }, []);

    function setUserState(newUser: User) {
        setUsers(users.map(user => (user.username === newUser.username ? { ...newUser } : user)));
    }

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
                        <UserRow user={user} />
                        <UserRow user={user} />
                        <UserRow user={user} />
                        <UserRow user={user} />
                    </>
                ))}
            </Grid>
        </>
    );
}
