import React, { useState } from "react";
import { makeStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import Card from '@material-ui/core/Card';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import Checkbox from '@material-ui/core/Checkbox';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import EditIcon from '@material-ui/icons/Edit';
import DeleteOutlineIcon from '@material-ui/icons/DeleteOutline';

const useStyles = makeStyles(theme => ({
    actions: {
        padding: theme.spacing(2)
    },
    expand: {
        marginLeft: 'auto'
    }
}));

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
    const classes = useStyles();
    return (
        <Card>
            <CardContent>
                <Typography variant="h6">{props.username}</Typography>
                <Typography variant="subtitle1">{props.email}</Typography>
                <FormControlLabel label="Admin?"
                    control={
                        <Checkbox
                            checked={isAdmin}
                            onChange={e => setAdmin(e.target.checked)}
                            color="primary"
                        />
                    }
                />
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
            </CardContent>
            <CardActions disableSpacing className={classes.actions}>
                <Button variant="outlined" color="secondary"
                    onClick={() => props.onDelete(state)}>
                    <DeleteOutlineIcon />
                    Delete
                    </Button>
                <Button variant="outlined" color="primary" className={classes.expand}
                    onClick={() => props.onUpdate(state)}>
                    <EditIcon />
                    Update
                </Button>
            </CardActions>
        </Card>
    );
}
