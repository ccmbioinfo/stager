import React, { useEffect, useState } from "react";
import { createHash } from "crypto";
import {
    Box,
    BoxProps,
    Chip,
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
    Tooltip,
    Typography,
    TypographyProps,
} from "@material-ui/core";
import {
    AccessTime,
    CalendarToday,
    ExpandLess,
    ExpandMore,
    FileCopy,
    LockOpen,
    Person,
    PersonOutline,
    Visibility,
    VisibilityOff,
} from "@material-ui/icons";
import { Skeleton } from "@material-ui/lab";

import { User } from "../utils/typings";
import { useSnackbar } from "notistack";

export default function UserList() {
    const [users, setUsers] = useState<User[]>([]);

    useEffect(() => {
        document.title = "Admin | ST2020";
        fetch("/api/users")
            .then(response => response.json())
            .then(setUsers); // No safety check on JSON structure
    }, []);

    return (
        <Grid container spacing={1} alignItems="flex-start">
            {users.map(user => (
                <>
                    <UserRow user={user} />
                    <UserRow user={user} />
                    <UserRow user={user} />
                    <UserRow user={user} />
                </>
            ))}
        </Grid>
    );
}

const useRowStyles = makeStyles(theme => ({
    button: {
        marginLeft: theme.spacing(1),
    },
}));

function UserRow(props: { user: User; inactive?: boolean }) {
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
                                    <PermissionChipGroup groups={["CHEO", "SK"]} />
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
                    <UserDetails />
                </Collapse>
            </Paper>
        </Grid>
    );
}

const useDetailStyles = makeStyles(theme => ({
    root: {
        margin: theme.spacing(1),
        padding: theme.spacing(2),
    },
}));

function UserDetails(props: { inactive?: boolean }) {
    const classes = useDetailStyles();

    return (
        <Box className={classes.root}>
            <Grid container xs={12}>
                <Grid item xs={12}>
                    <Typography>
                        <b>Status:</b> {props.inactive ? "Inactive" : "Active"}
                    </Typography>
                </Grid>
                <Grid item xs={12}>
                    <SecretKeyDisplay
                        title="MinIO Access Key"
                        secret={createHash("md5").update("accesskey").digest("hex")}
                    />
                </Grid>
                <Grid item xs={12}>
                    <SecretKeyDisplay
                        title="MinIO Secret Key"
                        secret={createHash("md5").update("secretkey").digest("hex")}
                    />
                </Grid>
            </Grid>
        </Box>
    );
}

function SecretKeyDisplay(props: { title: string; secret: string }) {
    const [open, isOpen] = useState(false);
    const { enqueueSnackbar } = useSnackbar();

    return (
        <Box>
            <Typography>
                <b>{props.title}</b>
                <Tooltip title={`${open ? "Hide" : "Show"} key`}>
                    <IconButton onClick={() => isOpen(!open)}>
                        {open ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                </Tooltip>
                <Tooltip title="Copy to clipboard">
                    <IconButton
                        onClick={async () => {
                            navigator.clipboard.writeText(props.secret).then(() => {
                                enqueueSnackbar(`${props.title} copied to clipboard.`);
                            });
                        }}
                    >
                        <FileCopy />
                    </IconButton>
                </Tooltip>
            </Typography>
            {open ? (
                <Typography style={{ cursor: "pointer" }}>{props.secret}</Typography>
            ) : (
                <Skeleton animation={false} variant="text" style={{ cursor: "pointer" }}>
                    <Typography>{props.secret}</Typography>
                </Skeleton>
            )}
        </Box>
    );
}

function LastLoginDisplay(props: { date: string; time: string } & TypographyProps) {
    const { date, time, ...typoProps } = props;

    return (
        <Typography {...typoProps}>
            <LockOpen fontSize="inherit" /> <CalendarToday fontSize="inherit" /> {date}{" "}
            <AccessTime fontSize="inherit" /> {time}
        </Typography>
    );
}

const useChipStyles = makeStyles(theme => ({
    chip: {
        marginLeft: theme.spacing(1),
    },
}));

function PermissionChipGroup(props: { groups: string[] } & BoxProps) {
    const classes = useChipStyles();
    const { groups, ...boxProps } = props;
    return (
        <Box {...boxProps}>
            {props.groups.map((groupName, index) => (
                <Chip label={groupName} className={classes.chip} />
            ))}
        </Box>
    );
}
