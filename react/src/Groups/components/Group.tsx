import React, { useState, useEffect } from "react";
import {
    makeStyles,
    Theme,
    Grid,
    IconButton,
    Typography,
    Box,
    Paper,
    TextField,
} from "@material-ui/core";
import { Group as GroupIcon, Edit, Check, Close, Delete } from "@material-ui/icons";
import { Group as GroupType } from "../../typings";

const useStyles = makeStyles((theme: Theme) => ({
    paper: {
        padding: theme.spacing(1),
        height: "100%",
        display: "flex",
        flexDirection: "column",
    },
    header: {
        display: "flex",
        alignItems: "flex-start",
    },
    content: {
        display: "flex",
        alignItems: "center",
    },
    grow: {
        flexGrow: 1,
    },
    actionButtons: {
        display: "flex",
        marginLeft: theme.spacing(0.5),
    },
    button: {
        padding: theme.spacing(1),
    },
    icon: {
        margin: theme.spacing(0.5),
    },
}));

export function Group(props: {
    group: GroupType;
    onNameChange: (newName: string) => void;
    onDelete: () => void;
}) {
    const classes = useStyles();
    const [editing, setEditing] = useState<boolean>(false);
    const [groupName, setGroupName] = useState<string>(props.group.group_name);
    const [numUsers, setNumUsers] = useState<number>(0);

    useEffect(() => {
        fetch(`/api/groups/${props.group.group_code}`)
            .then(response => response.json())
            .then(data => setNumUsers(data.users.length));
    }, [props]);

    return (
        <Grid item xs={12} sm={6} md={4} xl={3}>
            <Paper className={classes.paper}>
                <Box className={classes.header}>
                    <Box className={classes.grow}>
                        {editing ? (
                            <TextField
                                multiline
                                value={groupName}
                                onChange={e => setGroupName(e.target.value)}
                            />
                        ) : (
                            <Typography variant="h6">{props.group.group_name}</Typography>
                        )}
                    </Box>
                    <Box className={classes.actionButtons}>
                        {editing ? (
                            <>
                                <IconButton
                                    onClick={() => {
                                        props.onNameChange(groupName);
                                        setEditing(false);
                                    }}
                                    className={classes.button}
                                >
                                    <Check />
                                </IconButton>
                                <IconButton
                                    onClick={() => {
                                        setGroupName(props.group.group_name);
                                        setEditing(false);
                                    }}
                                    className={classes.button}
                                >
                                    <Close />
                                </IconButton>
                            </>
                        ) : (
                            <IconButton
                                onClick={() => setEditing(true)}
                                color="primary"
                                className={classes.button}
                            >
                                <Edit />
                            </IconButton>
                        )}
                        <IconButton
                            size="small"
                            onClick={props.onDelete}
                            color="secondary"
                            className={classes.button}
                        >
                            <Delete />
                        </IconButton>
                    </Box>
                </Box>
                <Box className={classes.grow} />
                <Box className={classes.content}>
                    <Typography variant="body1" className={classes.grow}>
                        {props.group.group_code.toUpperCase()}
                    </Typography>
                    <Box className={classes.content}>
                        <GroupIcon color="action" className={classes.icon} />
                        <Typography variant="body2">Users: {numUsers}</Typography>
                    </Box>
                </Box>
            </Paper>
        </Grid>
    );
}
