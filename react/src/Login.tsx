import React, { useEffect, useState } from "react";
import {
    makeStyles,
    Button,
    Container,
    Paper,
    TextField,
    Typography,
    Box,
} from "@material-ui/core";

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
    setLastLoginTime = (lastLogin: string) => {},
    setGlobalUsername = (username: string) => {},
    setIsAdmin = (isAdmin: boolean) => {},
    setGroups = (groups: string[]) => {},
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
            setGlobalUsername(data["username"]);
            setLastLoginTime(data["last_login"]);
            setIsAdmin(data["is_admin"]);
            setGroups(data["groups"]);
            setError("");
        } else {
            setError(await result.text());
        }
        setAuthenticated(result.ok);
    }
    useEffect(() => {
        document.title = `Sign in | ${process.env.REACT_APP_NAME}`;
    }, []);
    const classes = useStyles();
    return (
        <Box className={classes.root}>
            <Container maxWidth="sm">
                <Paper component="form" className={classes.form}>
                    <Typography variant="h5" component="h2" gutterBottom>
                        Sign in to {process.env.REACT_APP_NAME}
                    </Typography>
                    {error && (
                        <Typography component="p" color="secondary">
                            {error}
                        </Typography>
                    )}
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
                </Paper>
            </Container>
        </Box>
    );
}
