import React, { useEffect, useState } from "react";
import {
    makeStyles,
    Button,
    Container,
    Divider,
    Grid,
    Paper,
    TextField,
    Typography,
} from "@material-ui/core";

const useStyles = makeStyles(theme => ({
    root: {
        display: "fill",
    },
    appBarSpacer: theme.mixins.toolbar,
    content: {
        flexGrow: 1,
        height: "100vh",
        overflow: "auto",
    },
    container: {
        paddingTop: theme.spacing(3),
        paddingBottom: theme.spacing(3),
    },
    paper: {
        padding: theme.spacing(2),
        display: "flex",
        overflow: "auto",
        flexDirection: "column",
    },
    dividingSpacer: {
        marginTop: theme.spacing(1),
        marginBottom: theme.spacing(3),
    },
    submitButton: {
        marginTop: theme.spacing(3),
    },
}));

export default function Settings({ username }: { username: string }) {
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [result, setResult] = useState("");

    async function changePassword(e: React.MouseEvent) {
        e.preventDefault();
        const response = await fetch("/api/password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                current: currentPassword,
                password: newPassword,
                confirm: confirmPassword,
            }),
        });
        if (response.ok) {
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
            setResult("Password changed successfully");
        } else {
            setResult(await response.text());
        }
    }

    const classes = useStyles();

    useEffect(() => {
        document.title = "Settings | ST2020";
    }, []);

    return (
        <main className={classes.content}>
            <div className={classes.appBarSpacer} />
            <Container maxWidth={false} className={classes.container}>
                <Paper className={classes.paper} component="form">
                    <Typography variant="h4" component="h2">
                        Hello {username}!
                    </Typography>
                    <Divider className={classes.dividingSpacer} />
                    <Typography variant="h5" component="h3">
                        Change password
                    </Typography>
                    <TextField
                        required
                        variant="filled"
                        margin="dense"
                        type="password"
                        autoComplete="current-password"
                        label="Current password"
                        value={currentPassword}
                        onChange={e => setCurrentPassword(e.target.value)}
                    />
                    <TextField
                        required
                        variant="filled"
                        margin="dense"
                        type="password"
                        autoComplete="new-password"
                        label="New password"
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                    />
                    <TextField
                        required
                        variant="filled"
                        margin="dense"
                        type="password"
                        autoComplete="new-password"
                        label="Confirm password"
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                    />
                    <Grid container spacing={2} className={classes.submitButton}>
                        <Grid item xs={4}>
                            <Button
                                variant="contained"
                                color="secondary"
                                type="submit"
                                onClick={changePassword}
                            >
                                Update password
                            </Button>
                        </Grid>
                        <Grid item xs={8}>
                            <Typography variant="subtitle1">{result}</Typography>
                        </Grid>
                    </Grid>
                </Paper>
            </Container>
        </main>
    );
}
