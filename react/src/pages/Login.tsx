import React, { useEffect, useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import Container from '@material-ui/core/Container';
import Paper from '@material-ui/core/Paper';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';

const useStyles = makeStyles(theme => ({
    root: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        height: '100%'
    },
    form: {
        padding: theme.spacing(2)
    },
    textField: {
        display: 'block'
    },
    button: {
        display: 'block'
    },
}));

export default function LoginForm({
    setAuthenticated = function (auth: boolean) { }
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
            body: JSON.stringify({ username, password })
        });
        setAuthenticated(result.ok);
        setError(result.ok ? "" : await result.text());
    }
    async function signout() {
        const result = await fetch("/api/logout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ "dummy": true })
        });
        if (result.ok) {
            setAuthenticated(false);
        }
        setError(result.ok ? "" : await result.text());
    }
    useEffect(() => {
        document.title = "Sign in | ST2020";
    }, []);
    const classes = useStyles();
    return (
        <Container maxWidth="sm" className={classes.root}>
            <Paper component="form" className={classes.form}>
                <Typography variant="h5" component="h2" gutterBottom>
                    Sign in to ST2020
                </Typography>
                {error && <Typography component="p" color="secondary">{error}</Typography>}
                <TextField required variant="filled" fullWidth margin="normal"
                    className={classes.textField}
                    label="Username"
                    onChange={bind(setUsername)} />
                <TextField required variant="filled" fullWidth margin="normal"
                    className={classes.textField}
                    type="password"
                    label="Password"
                    onChange={bind(setPassword)}
                    autoComplete="current-password" />
                <Button variant="contained" color="primary" className={classes.button}
                    onClick={authenticate}>
                    Sign in
                </Button>
            </Paper>
        </Container>
    );
}

