import React, { useEffect, useState } from 'react';
import { makeStyles, Paper, Box, Typography, Tooltip, IconButton, Popover } from '@material-ui/core';
import { NotificationsActive } from '@material-ui/icons';
import Notification from './Notification';
import { AnalysisRow, jsonToAnalysisRows } from './analysis/Analysis';

const useStyles = makeStyles(theme => ({
    popover: {
        minWidth: '450px',
    },
    paper: {
        padding: theme.spacing(2), 
    },
    notifications: {
        '& > * + *': {
          marginTop: theme.spacing(2),
        },
        maxHeight: '500px',
    },
    title: {
        flexGrow: 1,
        paddingLeft: theme.spacing(1),
    },
    titleBox: {
        display: 'flex',
        alignItems: 'center',
        paddingBottom: theme.spacing(1),
    },
}));

export interface NotificationPopoverProps {
    lastLoginTime: string;
}

export default function NotificationPopover({ lastLoginTime }: NotificationPopoverProps) {
    const classes = useStyles();
    const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
    const [analyses, setAnalyses] = useState<AnalysisRow[]>([] as AnalysisRow[]);
    const popoverOpen = Boolean(anchorEl);

    const handlePopoverOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };
    const handlePopoverClose = () => {
        setAnchorEl(null);
    };
    useEffect(() => {
        const lastLoginISO = new Date(lastLoginTime).toISOString().slice(0, -1);
        fetch(`/api/analyses?since=${lastLoginISO}`).then(async response => {
            if (response.ok) {
                const result = jsonToAnalysisRows(await response.json());
                setAnalyses(result);
            } else {
                console.error(`GET /api/analyses?since=ISO_TIMESTAMP failed with ${response.status}: ${response.statusText}`);
            }
        });
    }, [lastLoginTime]);

    return (
        <div>
            <IconButton onClick={handlePopoverOpen}>
                <Tooltip title="See notifications" arrow>
                    <NotificationsActive fontSize='large' style={{fill: "white"}} />
                </Tooltip>
            </IconButton>
            <Popover
                open={popoverOpen}
                anchorEl={anchorEl}
                onClose={handlePopoverClose}
                anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'left',
                }}
                transformOrigin={{
                vertical: 'top',
                horizontal: 'center',
                }}
            >
                <div className={classes.popover}>
                    <Paper className={classes.paper}>
                        <Box className={classes.titleBox}>
                            <Typography component="h1" variant="h6" color="inherit" noWrap className={classes.title} display="inline">
                                {
                                    analyses.length === 0
                                    ? "No Notifications"
                                    : "Notifications"
                                }
                            </Typography>
                        </Box>
                        <Box>
                            <div className={classes.notifications}>
                                {analyses.map(analysis => <Notification analysis={analysis} />)}
                            </div>
                        </Box>
                    </Paper>
                </div>
            </Popover>  
        </div>
    );
}
