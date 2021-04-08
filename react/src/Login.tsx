import React, { useEffect, useState } from "react";
import {
    Box,
    Button,
    CircularProgress,
    Container,
    makeStyles,
    Paper,
    Typography,
} from "@material-ui/core";
import { BrowserRouter, Route, Switch, useHistory, useLocation } from "react-router-dom";
import { CurrentUser } from "./typings";

interface LoginProps {
    setAuthenticated: (auth: boolean) => void;
    setCurrentUser: (user: CurrentUser) => void;
}

const useCallbackStyles = makeStyles(theme => ({
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
    center: {
        display: "flex",
        justifyContent: "center",
    },
}));

/**
 * Handles the second-half of the OIDC Authorization Code flow.
 *
 * Relays the auth code, state, etc. from the OIDC Provider to the
 * backend API to begin the token exchange and sign the user in.
 */
function OIDCRedirectHandler(props: LoginProps) {
    const { setCurrentUser, setAuthenticated } = props;
    const classes = useCallbackStyles();
    const location = useLocation();
    const history = useHistory();
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    useEffect(() => {
        (async () => {
            if (location.search && history.location.pathname.includes("/oidc_callback")) {
                const response = await fetch(`/api/authorize${location.search}`, {
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
                    },
                });
                if (response.ok) {
                    const user = await response.json();
                    setIsLoading(false);
                    if (user.username) {
                        setMessage(user.username);
                        // Try to login and redirect
                        const loginResponse = await fetch("/api/login", { method: "POST" });
                        if (loginResponse.ok) {
                            const currentUser = await loginResponse.json();
                            setCurrentUser(currentUser);
                            history.push("/");
                            setAuthenticated(true);
                        } else {
                            setError("Failed to authorize. Please try again.");
                        }
                    } else {
                        setError("Failed to authorize. Please try again.");
                    }
                } else {
                    setIsLoading(false);
                    setError("Failed to authorize. Please try again.");
                }
            }
        })();
    }, [location.search, history, setAuthenticated, setCurrentUser]);

    return (
        <Box className={classes.root}>
            <Container maxWidth="sm">
                <Paper component="form" className={classes.form}>
                    <Typography variant="h5" component="h2" gutterBottom className={classes.center}>
                        {isLoading
                            ? "Working..."
                            : error
                            ? `Failed: ${error}`
                            : `Hello ${message}! Redirecting...`}
                    </Typography>
                    {(isLoading || !error) && (
                        <Container className={classes.center}>
                            <CircularProgress className={classes.center} />
                        </Container>
                    )}
                    {!isLoading && error && (
                        <Button onClick={() => history.push("/")}>Go back to Login</Button>
                    )}
                </Paper>
            </Container>
        </Box>
    );
}

const useStyles = makeStyles(theme => ({
    root: {
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        height: "100%",
        backgroundColor: theme.palette.background.default,
    },
    title: {
        display: "flex",
        justifyContent: "center",
    },
    form: {
        padding: theme.spacing(2),
    },
    button: {
        marginTop: theme.spacing(1),
    },
}));

export default function LoginForm(props: LoginProps) {
    const classes = useStyles();
    const [loginUrl, setLoginUrl] = useState("");

    useEffect(() => {
        document.title = `Sign in | ${process.env.REACT_APP_NAME}`;
        if (process.env.REACT_APP_API_ENDPOINT) {
            // Build login link with redirect route
            const redirect = new URL(`${window.location.origin}/oidc_callback`);
            const login = new URL(`${process.env.REACT_APP_API_ENDPOINT}/api/login`);
            login.searchParams.append("redirect_uri", redirect.href);
            setLoginUrl(login.href);
        }
    }, []);

    return (
        <BrowserRouter>
            <Switch>
                <Route path="/oidc_callback" render={() => <OIDCRedirectHandler {...props} />} />
                <Route
                    path="/"
                    render={() => (
                        <Box className={classes.root}>
                            <Container maxWidth="sm">
                                <Paper component="form" className={classes.form}>
                                    <Typography
                                        variant="h5"
                                        component="h2"
                                        gutterBottom
                                        className={classes.title}
                                    >
                                        Sign in to {process.env.REACT_APP_NAME}
                                    </Typography>
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        className={classes.button}
                                        type="submit"
                                        disabled={!loginUrl}
                                        href={loginUrl}
                                        fullWidth
                                    >
                                        Sign in using Keycloak
                                    </Button>
                                </Paper>
                            </Container>
                        </Box>
                    )}
                />
            </Switch>
        </BrowserRouter>
    );
}
