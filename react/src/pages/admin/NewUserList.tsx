import React, { useEffect, useState } from "react";
import { createHash } from "crypto";
import {
    Box,
    BoxProps,
    Button,
    ButtonGroup,
    Checkbox,
    Chip,
    Collapse,
    Divider,
    FormControlLabel,
    Grid,
    GridProps,
    IconButton,
    ListItem,
    ListItemAvatar,
    ListItemText,
    makeStyles,
    Paper,
    TextField,
    Toolbar,
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
    PersonAdd,
    PersonAddDisabled,
    PersonOutline,
    Visibility,
    VisibilityOff,
} from "@material-ui/icons";
import { Skeleton } from "@material-ui/lab";
import { useSnackbar } from "notistack";
import { GroupChip, User } from "../utils/typings";

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

function UserRow(props: { user: User }) {
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
                    <UserDetails user={props.user} />
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
    grow: {
        flexGrow: 1,
    },
}));

function UserDetails(props: { user: User }) {
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
                    <Grid item xs={12}>
                        <NewPasswordForm />
                    </Grid>
                </Grid>
                <Grid item md={12} lg={6}>
                    <Typography>
                        <b>Group Management</b>
                    </Typography>
                    <GroupManagementSection />
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

const usePermStyles = makeStyles(theme => ({
    chip: {
        marginLeft: theme.spacing(1),
    },
}));

function PermissionChipGroup(props: { groups: string[] } & BoxProps) {
    const classes = usePermStyles();
    const { groups, ...boxProps } = props;
    return (
        <Box {...boxProps}>
            {props.groups.map((groupName, index) => (
                <Chip size="small" label={groupName} className={classes.chip} />
            ))}
        </Box>
    );
}

function NewPasswordForm() {
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

const useGroupStyles = makeStyles(theme => ({
    root: {
        margin: theme.spacing(1),
    },
}));

function GroupManagementSection() {
    const classes = useGroupStyles();
    const [groups, setGroups] = useState<GroupChip[]>(
        ["FOO", "BAR", "BAZ", "FAZ"].map((label, index) => ({
            label: label,
            key: index,
            selected: false,
        }))
    );

    function toggleSelected(chip: GroupChip) {
        setGroups(
            groups.map(group =>
                group.key === chip.key ? { ...group, selected: !group.selected } : group
            )
        );
    }

    return (
        <Grid container xs={12} spacing={1} className={classes.root}>
            <Grid item container xs={12} alignItems="center">
                <Grid item>
                    <PersonAdd fontSize="large" />
                </Grid>
                <Grid item>
                    <ChipArray
                        chips={groups.filter(chip => !!chip.selected)}
                        onClick={toggleSelected}
                    />
                </Grid>
            </Grid>
            <Grid item container xs={12} alignItems="center">
                <Grid item>
                    <PersonAddDisabled fontSize="large" />
                </Grid>
                <Grid item>
                    <ChipArray
                        chips={groups.filter(chip => !chip.selected)}
                        onClick={toggleSelected}
                    />
                </Grid>
            </Grid>
        </Grid>
    );
}

const useChipStyles = makeStyles(theme => ({
    chipList: {
        display: "flex",
        justifyContent: "center",
        flexWrap: "wrap",
        listStyle: "none",
        padding: theme.spacing(0.5),
        margin: 0,
    },
    chip: {
        margin: theme.spacing(0.5),
    },
    paper: {
        margin: theme.spacing(1),
    },
}));

function ChipArray(props: { chips: GroupChip[]; onClick: (chip: GroupChip) => void }) {
    const classes = useChipStyles();

    return (
        <>
            {props.chips.length > 0 && (
                <Paper className={classes.paper}>
                    <Box component="ul" className={classes.chipList}>
                        {props.chips.map(chip => {
                            return (
                                <li key={chip.key}>
                                    <Chip
                                        label={chip.label}
                                        className={classes.chip}
                                        onClick={() => props.onClick(chip)}
                                    />
                                </li>
                            );
                        })}
                    </Box>
                </Paper>
            )}
        </>
    );
}
