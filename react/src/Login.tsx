import React, { useEffect, useState } from "react";
import {
    Box,
    Button,
    CircularProgress,
    Container,
    Grid,
    Link,
    makeStyles,
    Paper,
    TextField,
    Typography,
} from "@material-ui/core";
import { BrowserRouter, Redirect, Route, Switch, useHistory, useLocation } from "react-router-dom";
import { CurrentUser } from "./typings";

interface LoginProps {
    signout: () => void;
    setAuthenticated: (auth: boolean) => void;
    setCurrentUser: (user: CurrentUser) => void;
    oauth: boolean;
}

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
    center: {
        display: "flex",
        justifyContent: "center",
    },
    textField: {
        display: "block",
    },
    button: {
        marginTop: theme.spacing(1),
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
    const classes = useStyles();
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
                        setCurrentUser(user);
                        setAuthenticated(true);
                        history.push("/");
                    } else {
                        setError("Failed to authorize. Please try again.");
                    }
                } else {
                    setIsLoading(false);
                    if (response.status === 404) {
                        setError(
                            "You do not have permission to access Stager. Please contact an administrator to request access."
                        );
                    } else {
                        setError("Failed to authorize. Please try again.");
                    }
                }
            }
        })();
    }, [location.search, history, setAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

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
                        <Grid container alignItems="baseline" justify="space-between" spacing={1}>
                            <Grid item>
                                <Button
                                    onClick={() => {
                                        props.signout();
                                    }}
                                >
                                    Go back to Login
                                </Button>
                            </Grid>
                            <Grid item>
                                <Link
                                    href={`mailto:${process.env.REACT_APP_EMAIL}`}
                                    color="textSecondary"
                                >
                                    {process.env.REACT_APP_EMAIL}
                                </Link>
                            </Grid>
                        </Grid>
                    )}
                </Paper>
            </Container>
        </Box>
    );
}

/**
 * Original login form. Used when OAuth is not enabled.
 */
function LoginForm({
    setAuthenticated = (auth: boolean) => {},
    setCurrentUser = (user: CurrentUser) => {},
}) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    function bind(set: typeof setUsername) {
        // @ts-ignore
        return e => set(e.target.value);
    }
    async function authenticate(e: React.MouseEvent) {
        e.preventDefault();
        const result = await fetch("/api/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password }),
        });
        if (result.ok) {
            const data = await result.json();
            setCurrentUser(data);
            setError("");
        } else {
            setError(await result.text());
        }
        setAuthenticated(result.ok);
    }
    const classes = useStyles();
    return (
        <>
            <Typography variant="h5" component="h2" gutterBottom className={classes.center}>
                Sign in to {process.env.REACT_APP_NAME}
            </Typography>
            {error && (
                <Typography component="p" color="error">
                    {error}
                </Typography>
            )}
            <form>
                <TextField
                    required
                    variant="filled"
                    fullWidth
                    margin="normal"
                    className={classes.textField}
                    label="Username"
                    onChange={bind(setUsername)}
                />
                <TextField
                    required
                    variant="filled"
                    fullWidth
                    margin="normal"
                    className={classes.textField}
                    type="password"
                    label="Password"
                    onChange={bind(setPassword)}
                    autoComplete="current-password"
                />
                <Button
                    variant="contained"
                    color="primary"
                    className={classes.button}
                    type="submit"
                    onClick={authenticate}
                >
                    Sign in
                </Button>
            </form>
        </>
    );
}

/**
 * An empty page meant for redirecting the user directly to the OAuth login page.
 */
function OauthLoginForm() {
    const classes = useStyles();

    useEffect(() => {
        if (process.env.REACT_APP_API_ENDPOINT) {
            // Build login link with redirect route
            const redirect = new URL(`${window.location.origin}/oidc_callback`);
            const login = new URL(`${process.env.REACT_APP_API_ENDPOINT}/api/login`);
            login.searchParams.append("redirect_uri", redirect.href);
            console.log(`Redirecting to '${login.href}'`);
            window.location.replace(login.href);
        }
    }, []);

    return (
        <>
            <Typography variant="h5" component="h2" gutterBottom className={classes.center}>
                Redirecting to OAuth login for {process.env.REACT_APP_NAME || "Stager"}...
            </Typography>
            <Container className={classes.center}>
                <CircularProgress />
            </Container>
        </>
    );
}

/**
 * Wrapper component for rendering all possible login forms,
 * based on whether OAuth / OIDC is enabled or disabled.
 */
export default function LoginPage(props: LoginProps) {
    const classes = useStyles();

    useEffect(() => {
        document.title = `Sign in | ${process.env.REACT_APP_NAME}`;
    }, []);

    return (
        <BrowserRouter>
            <Switch>
                <Route
                    path="/oidc_callback"
                    render={() =>
                        props.oauth ? <OIDCRedirectHandler {...props} /> : <Redirect to="/" />
                    }
                />
                <Route
                    path="/"
                    render={() => (
                        <Box className={classes.root}>
                            <Container maxWidth="sm">
                                <Paper component="form" className={classes.form}>
                                    {props.oauth === true ? (
                                        <OauthLoginForm />
                                    ) : (
                                        <LoginForm {...props} />
                                    )}
                                </Paper>
                            </Container>
                        </Box>
                    )}
                />
            </Switch>
        </BrowserRouter>
    );
}
