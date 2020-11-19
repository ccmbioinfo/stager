import React, { useState } from "react";
import { IconButton, TextField, Typography } from "@material-ui/core";
import { Visibility, VisibilityOff } from "@material-ui/icons";

/**
 * A form element for creating a new password.
 */
export default function NewPasswordForm() {
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
            />
            <TextField
                required
                variant="filled"
                fullWidth
                margin="dense"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                label="Confirm password"
            />
        </>
    );
}
