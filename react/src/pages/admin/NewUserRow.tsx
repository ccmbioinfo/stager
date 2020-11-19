import React, { useState } from "react";
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
    Typography,
} from "@material-ui/core";
import { ExpandLess, ExpandMore, Person, PersonOutline } from "@material-ui/icons";
import { User } from "../utils/typings";
import UserDetails from "./UserDetails";
import LastLoginDisplay from "../utils/components/LastLoginDisplay";
import ChipGroup from "../utils/components/ChipGroup";

const useRowStyles = makeStyles(theme => ({
    button: {
        marginLeft: theme.spacing(1),
    },
}));

/**
 * Displays details about a user. Includes a collapsible panel for
 * viewing and editing credentials.
 */
export default function UserRow(props: { user: User }) {
    const classes = useRowStyles();
    const [date, time] = new Date().toISOString().split(/[T|.]/);
    const [open, setOpen] = useState(false);
    const gridProps: GridProps = {
        justify: "space-between",
        alignItems: "baseline",
        spacing: 2,
    };

    return (
        <Grid item sm={12} md={6}>
            <Paper>
                <ListItem>
                    <ListItemAvatar>
                        {props.user.isAdmin ? (
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
                                    <Typography variant="h6">{props.user.username}</Typography>
                                </Grid>
                                <Grid item>
                                    <LastLoginDisplay date={date} time={time} />
                                </Grid>
                            </Grid>
                        }
                        secondary={
                            <Grid container {...gridProps}>
                                <Grid item>
                                    <Typography variant="subtitle1">{props.user.email}</Typography>
                                </Grid>
                                <Grid item>
                                    <ChipGroup names={["CHEO", "SK"]} size="small" />
                                </Grid>
                            </Grid>
                        }
                    />
                    <IconButton onClick={e => setOpen(!open)} className={classes.button}>
                        {open ? <ExpandMore /> : <ExpandLess />}
                    </IconButton>
                </ListItem>
                <Collapse in={open}>
                    <Divider />
                    <UserDetails user={props.user} />
                </Collapse>
            </Paper>
        </Grid>
    );
}
