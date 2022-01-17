import React, { useEffect, useState } from "react";
import { Box, Container, Fab, Grid, makeStyles, Theme } from "@material-ui/core";
import { GroupAdd } from "@material-ui/icons";
import { useSnackbar } from "notistack";
import {
    useErrorSnackbar,
    useGroupDeleteMutation,
    useGroupsQuery,
    useGroupUpdateMutation,
} from "../hooks";
import CreateGroupModal from "./components/CreateGroupModal";
import { Group as GroupCard } from "./components/Group";

const useStyles = makeStyles((theme: Theme) => ({
    root: {
        flexGrow: 1,
        overflow: "auto",
    },
    appBarSpacer: theme.mixins.toolbar,
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
    const groupPatch = useGroupUpdateMutation();
    const groupDelete = useGroupDeleteMutation();
    const [openNewGroup, setOpenNewGroup] = useState(false);
    const { enqueueSnackbar } = useSnackbar();
    const enqueueErrorSnackbar = useErrorSnackbar();

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
                                                enqueueErrorSnackbar(
                                                    response,
                                                    `Failed to edit group ${group.group_name}.`
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
                                            enqueueErrorSnackbar(
                                                response,
                                                `Group ${group.group_name} deletion failed.`
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
