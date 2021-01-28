import React, { useEffect, useState } from "react";
import { useSnackbar } from "notistack";
import {
    makeStyles,
    Button,
    Container,
    Divider,
    Grid,
    Paper,
    TextField,
    Typography,
    Link,
} from "@material-ui/core";
import { MinioKeyDisplay, MinioResetButton, ChipGroup } from "../components";
import { useUserQuery, useUsersUpdateMutation } from "../hooks";

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
        marginTop: theme.spacing(1),
        display: "flex",
    },
    headerContainer: {
        display: "flex",
        alignItems: "center",
    },
    grow: {
        flexGrow: 1,
    },
    disabled: {
        color: theme.palette.text.disabled,
    },
    link: {
        "&:focus, &:hover, &:visited, &:link, &:active": {
            textDecoration: "none",
        },
        marginRight: theme.spacing(2),
        marginLeft: theme.spacing(2),
    },
}));

export default function Settings({ username }: { username: string }) {
    const classes = useStyles();
    const { data: user, isFetching: loading } = useUserQuery(username);
    const passwordMutation = useUsersUpdateMutation();

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [groups, setGroups] = useState<string[]>([]);
    const [updating, setUpdating] = useState(false);
    const { enqueueSnackbar } = useSnackbar();

    async function changePassword(e: React.MouseEvent) {
        e.preventDefault();
        setUpdating(true);
        passwordMutation.mutate(
            { username: username, current: currentPassword, password: newPassword },
            {
                onSuccess: newUser => {
                    setCurrentPassword("");
                    setNewPassword("");
                    setConfirmPassword("");
                    enqueueSnackbar("Password changed successfully.", { variant: "success" });
                },
                onError: async response => {
                    enqueueSnackbar(await response.text(), { variant: "error" });
                },
                onSettled: () => {
                    setUpdating(false);
                },
            }
        );
    }

    useEffect(() => {
        document.title = `Settings | ${process.env.REACT_APP_NAME}`;
    }, [username]);

    useEffect(() => {
        if (user) setGroups(user.groups.map(code => code.toUpperCase()));
    }, [user]);

    const passwordsDiffer = newPassword !== confirmPassword;
    const passwordErrorText = passwordsDiffer && "Passwords do not match.";
    const submittable = currentPassword && newPassword && !passwordsDiffer;

    return (
        <main className={classes.content}>
            <div className={classes.appBarSpacer} />
            <Container maxWidth={false} className={classes.container}>
                <Paper className={classes.paper} component="form">
                    <div className={classes.headerContainer}>
                        <Typography variant="h4" component="h2">
                            Hello {username}!
                        </Typography>
                        <div style={{ flexGrow: 1 }} />
                        {groups.length > 0 ? (
                            <ChipGroup names={groups} size="medium" />
                        ) : (
                            <div className={classes.disabled}>
                                You are not in any permission groups.
                            </div>
                        )}
                    </div>
                    <Divider className={classes.dividingSpacer} />
                    <Grid container spacing={2}>
                        <Grid item md={6} xs={12}>
                            <Typography component="h3">
                                <b>Change Password</b>
                            </Typography>
                            <TextField
                                required
                                fullWidth
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
                                fullWidth
                                variant="filled"
                                margin="dense"
                                type="password"
                                autoComplete="new-password"
                                label="New password"
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                                error={passwordsDiffer}
                                helperText={passwordErrorText}
                            />
                            <TextField
                                required
                                fullWidth
                                variant="filled"
                                margin="dense"
                                type="password"
                                autoComplete="new-password"
                                label="Confirm password"
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                error={passwordsDiffer}
                                helperText={passwordErrorText}
                            />
                        </Grid>
                        <Grid item md={6} xs={12}>
                            <MinioKeyDisplay
                                loading={loading || updating}
                                minio_access_key={user?.minio_access_key}
                                minio_secret_key={user?.minio_secret_key}
                            />
                        </Grid>
                    </Grid>
                    <div className={classes.submitButton}>
                        <Button
                            variant="contained"
                            color="secondary"
                            type="submit"
                            onClick={changePassword}
                            disabled={!submittable}
                        >
                            Update password
                        </Button>
                        <div className={classes.grow} />
                        <Link
                            href={process.env.REACT_APP_MINIO_URL}
                            target="_blank"
                            className={classes.link}
                        >
                            <Button variant="contained" color="primary">
                                Go to MinIO
                            </Button>
                        </Link>
                        <MinioResetButton username={username} />
                    </div>
                </Paper>
            </Container>
        </main>
    );
}
