import React from "react";
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
import NewPasswordForm from "../utils/components/NewPasswordForm";
import ChipTransferList from "../utils/components/ChipTransferList";

const useDetailStyles = makeStyles(theme => ({
    root: {
        margin: theme.spacing(1),
        padding: theme.spacing(2),
    },
    grow: {
        flexGrow: 1,
    },
}));

/**
 * The collapsible part of a user row. A form for viewing
 * and editing credentials.
 */
export default function UserDetails(props: { user: User }) {
    const classes = useDetailStyles();

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
                            control={<Checkbox checked={props.user.isAdmin} color="primary" />}
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <SecretDisplay
                            title="MinIO Access Key"
                            // TODO: Replace this with the actual secret
                            secret={createHash("md5").update("accesskey").digest("hex")}
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <SecretDisplay
                            title="MinIO Secret Key"
                            // TODO: Replace this with the actual secret
                            secret={createHash("md5").update("secretkey").digest("hex")}
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <NewPasswordForm />
                    </Grid>
                </Grid>
                <Grid item md={12} lg={6}>
                    <Typography>
                        <b>Group Management</b>
                    </Typography>
                    <ChipTransferList />
                </Grid>
            </Grid>
            <Toolbar>
                <div className={classes.grow} />
                <ButtonGroup>
                    <Button variant="contained">Cancel</Button>
                    <Button variant="contained" color="primary">
                        Save Changes
                    </Button>
                </ButtonGroup>
            </Toolbar>
        </Box>
    );
}
