import React, { useState } from "react";
import { IconButton, TextField, Typography } from "@material-ui/core";
import { Visibility, VisibilityOff } from "@material-ui/icons";

export interface ConfirmPasswordState {
    password: string;
    confirmPassword: string;
}

export interface ConfirmPasswordAction {
    type: "password" | "confirm";
    payload: string;
}

/**
 * A form element for creating a new password.
 */
export default function NewPasswordForm(props: {
    passwords: ConfirmPasswordState;
    dispatch: (action: ConfirmPasswordAction) => void;
}) {
    const [showPassword, setShowPassword] = useState(false);

    return (
        <>
            <Typography>
                <b>Change Password</b>
                <IconButton onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
            </Typography>
            <TextField
                required
                variant="filled"
                fullWidth
                margin="dense"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                label="New password"
                onChange={e => props.dispatch({ type: "password", payload: e.target.value })}
            />
            <TextField
                required
                variant="filled"
                fullWidth
                margin="dense"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                label="Confirm new password"
                onChange={e => props.dispatch({ type: "confirm", payload: e.target.value })}
            />
        </>
    );
}
