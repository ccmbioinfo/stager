import React, { useMemo, useState } from "react";
import {
    makeStyles,
    Paper,
    Box,
    Typography,
    Tooltip,
    IconButton,
    Popover,
    Badge,
} from "@material-ui/core";
import { NotificationsActive } from "@material-ui/icons";
import Notification from "./Notification";
import { Analysis } from "../typings";
import AnalysisInfoDialog from "./AnalysisInfoDialog";
import { useAnalysesQuery } from "../hooks";

const useStyles = makeStyles(theme => ({
    popover: {
        minWidth: "450px",
    },
    paper: {
        padding: theme.spacing(2),
    },
    notifications: {
        "& > * + *": {
            marginTop: theme.spacing(2),
        },
        maxHeight: "500px",
    },
    title: {
        flexGrow: 1,
        paddingLeft: theme.spacing(1),
    },
    titleBox: {
        display: "flex",
        alignItems: "center",
        paddingBottom: theme.spacing(1),
    },
    icon: {
        padding: 0,
        marginRight: theme.spacing(1),
    },
}));

export interface NotificationPopoverProps {
    lastLoginTime: string;
}

export default function NotificationPopover({ lastLoginTime }: NotificationPopoverProps) {
    const classes = useStyles();
    const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
    const lastLoginDate = useMemo(() => new Date(lastLoginTime), [lastLoginTime]);
    const { data: analysisQuery } = useAnalysesQuery(lastLoginDate);
    const analyses = useMemo(() => analysisQuery?.data || [], [analysisQuery]);
    const popoverOpen = Boolean(anchorEl);
    const [clickedAnalysis, setClickedAnalysis] = useState<Analysis | null>(null);
    const [openDialog, setOpenDialog] = useState<boolean>(false);

    const DISPLAY_MAX = 50;

    const handlePopoverOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };
    const handlePopoverClose = () => {
        setAnchorEl(null);
    };

    return (
        <>
            <Tooltip title="See notifications" arrow>
                <IconButton onClick={handlePopoverOpen} className={classes.icon}>
                    <Badge badgeContent={analyses?.length} max={DISPLAY_MAX} color="secondary">
                        <NotificationsActive fontSize="large" style={{ fill: "white" }} />
                    </Badge>
                </IconButton>
            </Tooltip>

            <Popover
                open={popoverOpen}
                anchorEl={anchorEl}
                onClose={handlePopoverClose}
                anchorOrigin={{
                    vertical: "bottom",
                    horizontal: "left",
                }}
                transformOrigin={{
                    vertical: "top",
                    horizontal: "center",
                }}
            >
                <div className={classes.popover}>
                    <Paper className={classes.paper}>
                        <Box className={classes.titleBox}>
                            <Typography
                                component="h1"
                                variant="h6"
                                color="inherit"
                                noWrap
                                className={classes.title}
                                display="inline"
                            >
                                {analyses?.length === 0 ? "No Notifications" : "Notifications"}
                            </Typography>
                        </Box>
                        <Box>
                            <div className={classes.notifications}>
                                {analyses &&
                                    analyses
                                        .sort((a, b) => (a.updated > b.updated ? -1 : 1))
                                        .slice(0, DISPLAY_MAX)
                                        .map(analysis => (
                                            <Notification
                                                key={analysis.analysis_id}
                                                analysis={analysis}
                                                onClick={() => {
                                                    setClickedAnalysis(analysis);
                                                    setOpenDialog(true);
                                                }}
                                            />
                                        ))}
                            </div>
                        </Box>
                    </Paper>
                </div>
            </Popover>
            {clickedAnalysis !== null && (
                <AnalysisInfoDialog
                    open={openDialog}
                    onClose={() => {
                        setOpenDialog(false);
                    }}
                    analysis={clickedAnalysis}
                />
            )}
        </>
    );
}
