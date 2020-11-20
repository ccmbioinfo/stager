import React, { useReducer, useState } from "react";
import { createHash } from "crypto";
import {
    Box,
    Button,
    ButtonGroup,
    Checkbox,
    FormControlLabel,
    Grid,
    makeStyles,
    Toolbar,
    Typography,
} from "@material-ui/core";
import { User } from "../utils/typings";
import SecretDisplay from "../utils/components/SecretDisplay";
import NewPasswordForm, {
    ConfirmPasswordAction,
    ConfirmPasswordState,
} from "../utils/components/NewPasswordForm";
import ChipTransferList, { TransferChip } from "../utils/components/ChipTransferList";

const useDetailStyles = makeStyles(theme => ({
    root: {
        margin: theme.spacing(1),
        padding: theme.spacing(2),
    },
    grow: {
        flexGrow: 1,
    },
    toolbar: {
        padding: 0,
    },
}));

function passwordReducer(state: ConfirmPasswordState, action: ConfirmPasswordAction) {
    switch (action.type) {
        case "password":
            return { ...state, password: action.payload };
        case "confirm":
            return { ...state, confirmPassword: action.payload };
        default:
            return state;
    }
}

/**
 * The collapsible part of a user row. A form for viewing
 * and editing credentials.
 */
export default function UserDetails(props: { user: User; onSave: (newUser: User) => void }) {
    const classes = useDetailStyles();
    // Local changes saved in newState, and are "committed" when user saves changes
    const oldState = { ...props.user };
    const [newState, setNewState] = useState<User>(() => props.user);
    const [passwords, passDispatch] = useReducer(passwordReducer, {
        password: "",
        confirmPassword: "",
    });

    // TODO: hook up with actual permission groups
    const [tempGroups, setTempGroups] = useState<TransferChip[]>(
        ["FOO", "BAR", "BAZ"].map((label, index) => ({
            label: label,
            key: index,
            selected: false,
        }))
    );

    return (
        <Box className={classes.root}>
            <Grid container xs={12} spacing={1}>
                <Grid container item md={12} lg={6} spacing={1}>
                    <Grid item xs={6}>
                        <FormControlLabel
                            label={<b>Active User</b>}
                            control={<Checkbox checked={true} color="primary" />}
                        />
                    </Grid>
                    <Grid item xs={6}>
                        <FormControlLabel
                            label={<b>Admin</b>}
                            control={
                                <Checkbox
                                    checked={newState.isAdmin}
                                    color="primary"
                                    onChange={e =>
                                        setNewState(state => ({
                                            ...state,
                                            isAdmin: e.target.checked,
                                        }))
                                    }
                                />
                            }
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <SecretDisplay
                            title="MinIO Access Key"
                            // TODO: Replace this with the actual secret
                            secret={createHash("md5").update(props.user.username).digest("hex")}
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <SecretDisplay
                            title="MinIO Secret Key"
                            // TODO: Replace this with the actual secret
                            secret={createHash("md5").update(props.user.email).digest("hex")}
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <NewPasswordForm passwords={passwords} dispatch={passDispatch} />
                    </Grid>
                </Grid>
                <Grid item md={12} lg={6}>
                    <Typography>
                        <b>Group Management</b>
                    </Typography>
                    <ChipTransferList chips={tempGroups} setChips={setTempGroups} />
                </Grid>
            </Grid>
            <Toolbar className={classes.toolbar}>
                <Button color="secondary" variant="contained">
                    Reset MinIO Credentials
                </Button>
                <div className={classes.grow} />
                <ButtonGroup disabled={oldState === newState}>
                    <Button variant="contained">Cancel</Button>
                    <Button variant="contained" color="primary">
                        Save Changes
                    </Button>
                </ButtonGroup>
            </Toolbar>
        </Box>
    );
}
