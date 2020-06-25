import React, { useState } from "react";
import Button from '@material-ui/core/Button';
import Checkbox from '@material-ui/core/Checkbox';
import Grid from '@material-ui/core/Grid';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';

export interface UserRowState {
    username: string;
    email: string;
    isAdmin: boolean;
    password: string;
    confirmPassword: string;
}

export interface UserRowProps extends UserRowState {
    onUpdate: (state: UserRowState) => void;
    onDelete: (state: UserRowState) => void;
}

export default function UserRow(props: UserRowProps) {
    const [isAdmin, setAdmin] = useState(props.isAdmin);
    const [password, setPassword] = useState(props.password);
    const [confirmPassword, setConfirmPassword] = useState(props.confirmPassword);
    const state = {
        username: props.username,
        email: props.email,
        isAdmin,
        password,
        confirmPassword
    };
    return (
        <>
            <Grid item xs={4}>
                <Typography variant="button" component="p">{props.username}</Typography>
                <Typography variant="button" component="p">{props.email}</Typography>
            </Grid>
            <Grid item xs={1}>
                <Checkbox
                    checked={isAdmin}
                    onChange={e => setAdmin(e.target.checked)}
                    color="primary"
                    inputProps={{ 'aria-label': 'admin checkbox' }}
                />
            </Grid>
            <Grid item xs={6}>
                <TextField required variant="filled" fullWidth margin="dense"
                    type="password" autoComplete="new-password"
                    label="New password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                />
                <TextField required variant="filled" fullWidth margin="dense"
                    type="password" autoComplete="new-password"
                    label="Confirm password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                />
            </Grid>
            <Grid item xs={1}>
                <Button variant="contained" color="primary"
                    onClick={() => props.onUpdate(state)}>
                    Update
                </Button>
                <Button variant="contained" color="secondary"
                    onClick={() => props.onDelete(state)}>
                    Delete
                    </Button>
            </Grid>
        </>
    );
}
