import React, { useState } from "react";
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
import ConfirmModal from "../../components/ConfirmModal";
import { Group as GroupType } from "../../typings";
import { useGroupQuery } from "../../hooks";

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

interface GroupProps {
    group: GroupType;
    onNameChange: (newName: string) => void;
    onDelete: () => void;
}

export function Group({ group, onNameChange, onDelete }: GroupProps) {
    const classes = useStyles();
    const [editing, setEditing] = useState<boolean>(false);
    const [groupName, setGroupName] = useState<string>(group.group_name);
    const tempGroup = useGroupQuery(group.group_code);
    let numUsers = 0;
    if (tempGroup && tempGroup.users) numUsers = tempGroup.users.length;
    const [confirmDelete, setConfirmDelete] = useState<boolean>(false);

    return (
        <Grid item xs={12} sm={6} md={4} xl={3}>
            <ConfirmModal
                id="confirm-modal-delete"
                open={confirmDelete}
                onClose={() => setConfirmDelete(false)}
                onConfirm={() => {
                    onDelete();
                    setConfirmDelete(false);
                }}
                title="Delete group"
                colors={{ cancel: "secondary" }}
            >
                Are you sure you want to delete group {group.group_name}?
            </ConfirmModal>
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
                            <Typography variant="h6">{group.group_name}</Typography>
                        )}
                    </Box>
                    <Box className={classes.actionButtons}>
                        {editing ? (
                            <>
                                <IconButton
                                    onClick={() => {
                                        onNameChange(groupName);
                                        setEditing(false);
                                    }}
                                    className={classes.button}
                                >
                                    <Check />
                                </IconButton>
                                <IconButton
                                    onClick={() => {
                                        setGroupName(group.group_name);
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
                            onClick={() => setConfirmDelete(true)}
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
                        {group.group_code.toUpperCase()}
                    </Typography>
                    <Box className={classes.content}>
                        <GroupIcon color="action" className={classes.icon} />
                        <Typography variant="body1">Users: {numUsers}</Typography>
                    </Box>
                </Box>
            </Paper>
        </Grid>
    );
}
