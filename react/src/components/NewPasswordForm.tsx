import React, { useState } from "react";
import { IconButton, TextField, Typography } from "@material-ui/core";
import { Visibility, VisibilityOff } from "@material-ui/icons";
import { ConfirmPasswordAction, ConfirmPasswordState } from "../typings";

/**
 * A form element for creating a new password.
 */
export default function NewPasswordForm(props: {
    passwords: ConfirmPasswordState;
    dispatch: (action: ConfirmPasswordAction) => void;
}) {
    const [showPassword, setShowPassword] = useState(false);

    const passwordsDiffer = props.passwords.password !== props.passwords.confirmPassword;
    const passwordErrorText = passwordsDiffer && "Passwords do not match.";

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
                value={props.passwords.password}
                onChange={e => props.dispatch({ type: "password", payload: e.target.value })}
                error={passwordsDiffer}
                helperText={passwordErrorText}
            />
            <TextField
                required
                variant="filled"
                fullWidth
                margin="dense"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                label="Confirm new password"
                value={props.passwords.confirmPassword}
                onChange={e => props.dispatch({ type: "confirm", payload: e.target.value })}
                error={passwordsDiffer}
                helperText={passwordErrorText}
            />
        </>
    );
}
