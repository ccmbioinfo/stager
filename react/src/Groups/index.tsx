import React, { useState, useEffect } from "react";
import { makeStyles, Theme, Grid, Fab, Box, Container } from "@material-ui/core";
import { GroupAdd } from "@material-ui/icons";
import { useSnackbar } from "notistack";
import { Group as GroupCard } from "./components/Group";
import CreateGroupModal from "./components/CreateGroupModal";
import { Group } from "../typings";

const useStyles = makeStyles((theme: Theme) => ({
    root: {
        flexGrow: 1,
        overflow: "auto",
    },
    appBarSpacer: theme.mixins.toolbar,
    grow: {
        flexGrow: 1,
    },
    toolbar: {
        marginBottom: theme.spacing(1),
    },
    container: {
        paddingTop: theme.spacing(3),
        paddingBottom: theme.spacing(3),
    },
    addButton: {
        position: "absolute",
        right: theme.spacing(4),
        bottom: theme.spacing(3),
    },
}));

export default function Groups() {
    const classes = useStyles();
    const [groups, setGroups] = useState<Group[]>([]);
    const [openNewGroup, setOpenNewGroup] = useState<boolean>(false);
    const { enqueueSnackbar } = useSnackbar();

    useEffect(() => {
        document.title = `Groups | ${process.env.REACT_APP_NAME}`;

        fetch("/api/groups")
            .then(response => response.json())
            .then(data => setGroups(data as Group[]));
    }, [openNewGroup]);
    return (
        <Box className={classes.root}>
            <div className={classes.appBarSpacer} />
            <Container className={classes.container} maxWidth={false}>
                <CreateGroupModal open={openNewGroup} onClose={() => setOpenNewGroup(false)} />
                <Grid container spacing={1} alignItems="stretch">
                    {groups.map(group => (
                        <GroupCard
                            key={group.group_code}
                            group={group}
                            onNameChange={async (newName: string) => {
                                const response = await fetch(`/api/groups/${group.group_code}`, {
                                    method: "PATCH",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({
                                        ...group,
                                        group_name: newName,
                                    }),
                                });
                                if (response.ok) {
                                    const responseData = (await response.json()) as Group;
                                    setGroups(
                                        groups.map(currGroup =>
                                            currGroup.group_code === group.group_code
                                                ? { ...group, group_name: responseData.group_name }
                                                : currGroup
                                        )
                                    );
                                    enqueueSnackbar(
                                        `Group ${group.group_name} renamed to ${responseData.group_name} successfully.`,
                                        { variant: "success" }
                                    );
                                } else {
                                    enqueueSnackbar(
                                        `Failed to edit group ${group.group_name}. Error: ${response.status} - ${response.statusText}`,
                                        { variant: "error" }
                                    );
                                }
                            }}
                            onDelete={async () => {
                                const response = await fetch(`/api/groups/${group.group_code}`, {
                                    method: "DELETE",
                                    credentials: "same-origin",
                                });
                                if (response.ok) {
                                    const responseData = await response.json();
                                    setGroups(
                                        groups.filter(
                                            currGroup =>
                                                currGroup.group_code !== responseData.group_code
                                        )
                                    );
                                    enqueueSnackbar(
                                        `Group ${group.group_name} deleted successfully.`,
                                        { variant: "success" }
                                    );
                                } else {
                                    enqueueSnackbar(
                                        `Group ${group.group_name} deletion failed. Error: ${response.status} - ${response.statusText}`,
                                        { variant: "error" }
                                    );
                                }
                            }}
                        />
                    ))}
                </Grid>
                <Fab
                    color="primary"
                    aria-label="add"
                    onClick={() => setOpenNewGroup(true)}
                    className={classes.addButton}
                >
                    <GroupAdd />
                </Fab>
            </Container>
        </Box>
    );
}
