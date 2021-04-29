import React from "react";
import { Box, Container, makeStyles, Theme } from "@material-ui/core";
import UserList from "./components/UserList";

const useStyles = makeStyles((theme: Theme) => ({
    root: {
        flexGrow: 1,
        overflow: "auto",
    },
    appBarSpacer: theme.mixins.toolbar,
    container: {
        marginTop: theme.spacing(3),
        marginBottom: theme.spacing(3),
    },
}));

export default function Admin() {
    const classes = useStyles();

    return (
        <Box className={classes.root}>
            <div className={classes.appBarSpacer} />
            <Container className={classes.container} maxWidth={false}>
                <UserList />
            </Container>
        </Box>
    );
}
