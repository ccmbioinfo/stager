import React, { useState, useEffect } from "react";
import { makeStyles, Theme, Grid, Fab, Box, Container } from "@material-ui/core";
import { GroupAdd } from "@material-ui/icons";
import { useSnackbar } from "notistack";
import { Group as GroupCard } from "./components/Group";
import CreateGroupModal from "./components/CreateGroupModal";
import { useGroupsQuery, useGroupsUpdateMutation, useGroupsDeleteMutation } from "../hooks";

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
    const { data: groups } = useGroupsQuery();
    const groupPatch = useGroupsUpdateMutation();
    const groupDelete = useGroupsDeleteMutation();
    const [openNewGroup, setOpenNewGroup] = useState(false);
    const { enqueueSnackbar } = useSnackbar();

    useEffect(() => {
        document.title = `Groups | ${process.env.REACT_APP_NAME}`;
    }, []);

    return (
        <Box className={classes.root}>
            <div className={classes.appBarSpacer} />
            <Container className={classes.container} maxWidth={false}>
                <CreateGroupModal open={openNewGroup} onClose={() => setOpenNewGroup(false)} />
                <Grid container spacing={1} alignItems="stretch">
                    {groups &&
                        groups.map(group => (
                            <GroupCard
                                key={group.group_code}
                                group={group}
                                onNameChange={(newName: string) => {
                                    groupPatch.mutate(
                                        { ...group, group_name: newName },
                                        {
                                            onSuccess: patchedGroup => {
                                                enqueueSnackbar(
                                                    `Group ${group.group_name} renamed to ${patchedGroup.group_name} successfully.`,
                                                    { variant: "success" }
                                                );
                                            },
                                            onError: response => {
                                                enqueueSnackbar(
                                                    `Failed to edit group ${group.group_name}. Error: ${response.status} - ${response.statusText}`,
                                                    { variant: "error" }
                                                );
                                            },
                                        }
                                    );
                                }}
                                onDelete={() => {
                                    groupDelete.mutate(group.group_code, {
                                        onSuccess: () => {
                                            enqueueSnackbar(
                                                `Group ${group.group_name} deleted successfully.`,
                                                { variant: "success" }
                                            );
                                        },
                                        onError: response => {
                                            enqueueSnackbar(
                                                `Group ${group.group_name} deletion failed. Error: ${response.status} - ${response.statusText}`,
                                                { variant: "error" }
                                            );
                                        },
                                    });
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
