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
import { useUsersQuery } from "../../hooks";
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
    const [openNewUser, setOpenNewUser] = useState(false);

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
                    {users && users.map(user => <UserRow key={user.username} user={user} />)}
                </Grid>
            </List>
        </>
    );
}
