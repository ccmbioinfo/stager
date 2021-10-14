import { useState } from "react";
import {
    Collapse,
    Divider,
    Grid,
    GridProps,
    IconButton,
    ListItem,
    ListItemAvatar,
    ListItemText,
    makeStyles,
    Paper,
    Theme,
    Typography,
} from "@material-ui/core";
import { ExpandLess, ExpandMore, Person, PersonOutline, Security } from "@material-ui/icons";
import { ChipGroup, LastLoginDisplay } from "../../components";
import { User } from "../../typings";
import UserDetails from "./UserDetails";

const useRowStyles = makeStyles<Theme, User>(theme => ({
    button: {
        marginLeft: theme.spacing(1),
    },
    title: {
        color: user =>
            user.deactivated ? theme.palette.text.disabled : theme.palette.text.primary,
        fontStyle: user => (user.deactivated ? "italic" : "normal"),
    },
    icon: {
        color: user =>
            user.deactivated ? theme.palette.text.disabled : theme.palette.text.primary,
    },
}));

/**
 * Displays details about a user. Includes a collapsible panel for
 * viewing and editing credentials.
 */
export default function UserRow({ user }: { user: User }) {
    const classes = useRowStyles(user || ({} as User));
    const [open, setOpen] = useState(false);

    const gridProps: GridProps = {
        justifyContent: "space-between",
        alignItems: "baseline",
        spacing: 2,
    };

    return user ? (
        <Grid item sm={12} md={6}>
            <Paper>
                <ListItem>
                    <ListItemAvatar className={classes.icon}>
                        {!user.deactivated ? (
                            <Person fontSize="large" />
                        ) : (
                            <PersonOutline fontSize="large" />
                        )}
                    </ListItemAvatar>
                    <ListItemText
                        disableTypography
                        primary={
                            <Grid container {...gridProps}>
                                <Grid item>
                                    <Typography variant="h6" className={classes.title}>
                                        {user.username}{" "}
                                        {user.is_admin && <Security fontSize="inherit" />}
                                    </Typography>
                                </Grid>
                                <Grid item>
                                    <LastLoginDisplay timestamp={user.last_login} />
                                </Grid>
                            </Grid>
                        }
                        secondary={
                            <Grid container {...gridProps}>
                                <Grid item>
                                    <Typography variant="subtitle1" className={classes.title}>
                                        {user.email}
                                    </Typography>
                                </Grid>
                                <Grid item>
                                    <ChipGroup
                                        names={user.groups.map(group => group.toUpperCase())}
                                        size="small"
                                    />
                                </Grid>
                            </Grid>
                        }
                    />
                    <IconButton onClick={e => setOpen(!open)} className={classes.button}>
                        {open ? <ExpandLess /> : <ExpandMore />}
                    </IconButton>
                </ListItem>
                <Collapse in={open}>
                    <Divider />
                    {open && <UserDetails username={user.username} />}
                </Collapse>
            </Paper>
        </Grid>
    ) : (
        <span>Loading...</span>
    );
}
