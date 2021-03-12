import React, { useEffect } from "react";
import { Box, Button, Container, makeStyles, Paper, Typography } from "@material-ui/core";
import { CurrentUser } from "./typings";

const useStyles = makeStyles(theme => ({
    root: {
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        height: "100%",
        backgroundColor: theme.palette.background.default,
    },
    form: {
        padding: theme.spacing(2),
    },
    textField: {
        display: "block",
    },
    button: {
        display: "block",
    },
}));

export default function LoginForm({
    setAuthenticated = (auth: boolean) => {},
    setCurrentUser = (user: CurrentUser) => {},
}) {
    const classes = useStyles();

    async function handleClick(e: React.MouseEvent) {
        e.preventDefault();
        window.location.assign("http://localhost:5000/login");
    }

    useEffect(() => {
        document.title = `Sign in | ${process.env.REACT_APP_NAME}`;
    }, []);

    return (
        <Box className={classes.root}>
            <Container maxWidth="sm">
                <Paper component="form" className={classes.form}>
                    <Typography variant="h5" component="h2" gutterBottom>
                        Sign in to {process.env.REACT_APP_NAME}
                    </Typography>
                    <Button
                        variant="contained"
                        color="primary"
                        className={classes.button}
                        type="submit"
                        onClick={handleClick}
                    >
                        Sign in using Keycloak
                    </Button>
                </Paper>
            </Container>
        </Box>
    );
}
