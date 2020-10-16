import React, { useEffect } from 'react';
import { makeStyles, Paper, Box, Typography, Tooltip, IconButton, Popover } from '@material-ui/core';
import { NotificationsActive } from '@material-ui/icons';
import Notification from './Notification';
import { AnalysisRow, PipelineStatus, createAnalysis } from './analysis/Analysis';

const useStyles = makeStyles(theme => ({
    paper: {
        padding: theme.spacing(2),
        display: 'flex',
        overflow: 'auto',
        flexDirection: 'column',
    },
    alert: {
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

//generate fake data
const analyses = [
    createAnalysis("A0000", "P01", '/path/to/file/', "User 2", "User 3", PipelineStatus.COMPLETED, '2020-05-23 12:09 PM', "Notes example"),
    createAnalysis("1", "P02", '/example/path/', "User 4", "User 3", PipelineStatus.RUNNING, '2020-06-13 1:09 AM', ""),
    createAnalysis("A0002", "P01", '/foo/', "User 2", "User 5", PipelineStatus.ERROR, '2020-06-19 4:32 AM', ""),
    createAnalysis("A0003", "P02", '/foo/bar/', "User 3", "User 1", PipelineStatus.PENDING, '2020-06-22 8:56 PM', "Do not run until later."),
];

export interface NotificationPopoverProps {
    // analyses: AnalysisRow[];
    lastLoginTime: string;

}

export default function NotificationPopover({ lastLoginTime }: NotificationPopoverProps) {
    const classes = useStyles();
    const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(null);
    const popoverOpen = Boolean(anchorEl);

    useEffect(() => {
        // fetch("/api/enums").then(async response => {
        //     if (response.ok) {
        //         const enums = await response.json();
        //     } else {
        //         console.error(`GET /api/enums failed with ${response.status}: ${response.statusText}`);
        //     }
        // });
        fetch("/api/participants").then(async response => {
            if (response.ok) {
                console.log(await response.json())
                // setDatasets(await response.json());
            } else {
                console.error(`GET /api/datasets failed with ${response.status}: ${response.statusText}`);
            }
        });
        // fetch("/api/pipelines").then(async response => {
        //     if (response.ok) {
        //         // setPipelines(await response.json());
        //     } else {
        //         console.error(`GET /api/pipelines failed with ${response.status}: ${response.statusText}`);
        //     }
        // })
    }, []);

    const handlePopoverOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };
    const handlePopoverClose = () => {
        setAnchorEl(null);
    };

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
                        <div className={classes.alert}>
                            {analyses.map(analysis => <Notification analysis={analysis} />)}
                        </div>
                    </Box> 
                </Paper>
            </Popover>              
        </div>
    );
}
