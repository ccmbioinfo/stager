import React from 'react';
import clsx from 'clsx';
import { BrowserRouter, Switch, Route } from 'react-router-dom';
import { 
    makeStyles, CssBaseline, Drawer, AppBar, Toolbar, List, ListItem, ListItemIcon, ListItemText,
    Typography, Divider, IconButton, Tooltip
} from '@material-ui/core';
import {
    Menu as MenuIcon, ChevronLeft as ChevronLeftIcon, Dashboard as DashboardIcon, 
    People as PeopleIcon, Publish as UploadIcon, Settings as SettingsIcon, 
    ShowChart as ShowChartIcon, MeetingRoom as MeetingRoomIcon, VerifiedUser as VerifiedUserIcon, 
    AccountCircle as AccountCircleIcon
} from '@material-ui/icons';

import Dashboard from './dashboard/Dashboard';
import Analysis from './analysis/Analysis';
import Datasets from './datasets/Datasets';
import Uploads from './upload/Uploads';
import Settings from './settings/Settings';
import Admin from './admin/Admin';
import ListItemRouterLink from './ListItemRouterLink';
import NotificationPopover from './NotificationPopover';

const drawerWidth = 180;

const useStyles = makeStyles(theme => ({
    root: {
        display: 'flex',
        height: '100%',
    },
    toolbarIcon: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        padding: '0 8px',
        ...theme.mixins.toolbar,
    },
    appBar: {
        zIndex: theme.zIndex.drawer + 1,
        transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
        }),
    },
    appBarShift: {
        marginLeft: drawerWidth,
        width: `calc(100% - ${drawerWidth}px)`,
        transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
        }),
    },
    toolbar: {
        paddingLeft: theme.spacing(3),
        paddingRight: theme.spacing(3)
    },
    toolbarShift: {
        paddingLeft: theme.spacing(2),
        paddingRight: theme.spacing(3)
    },
    menuButton: {
        marginRight: theme.spacing(4),
    },
    menuButtonHidden: {
        marginRight: theme.spacing(3),
        display: 'none',
    },
    title: {
        flexGrow: 1,
    },
    drawerPaper: {
        position: 'relative',
        whiteSpace: 'nowrap',
        width: drawerWidth,
        transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
        }),
    },
    drawerPaperClose: {
        overflowX: 'hidden',
        transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
        }),
        width: theme.spacing(7),
    },
    bottomItems: {
        marginTop: 'auto',
    },
}));

export interface NavigationProps {
    signout: () => void;
    username: string;
    lastLoginTime: string;
}

export default function Navigation({ username, signout, lastLoginTime }: NavigationProps) {
    const classes = useStyles();
    const [open, setOpen] = React.useState(false);
    const [pageName, setPageName] = React.useState("Dashboard");
    
    const handleDrawerOpen = () => {
        setOpen(true);
    };
    const handleDrawerClose = () => {
        setOpen(false);
    };

    return (
        <div className={classes.root}>
            <BrowserRouter>
                <CssBaseline />
                <AppBar position="absolute" className={clsx(classes.appBar, open && classes.appBarShift)}>
                    <Toolbar disableGutters className={open ? classes.toolbar : classes.toolbarShift}>
                        <IconButton
                            edge="start"
                            color="inherit"
                            aria-label="open drawer"
                            onClick={handleDrawerOpen}
                            className={open ? classes.menuButtonHidden : classes.menuButton}
                        >
                            <MenuIcon />
                        </IconButton>
                        <Typography component="h1" variant="h6" color="inherit" noWrap className={classes.title}>
                            {pageName}
                        </Typography>
                        <NotificationPopover lastLoginTime={lastLoginTime} />
                        <Tooltip title={"Logged in as " + username} arrow>
                            <AccountCircleIcon fontSize='large' />
                        </Tooltip>
                    </Toolbar>
                </AppBar>
                <Drawer
                    variant="permanent"
                    classes={{
                        paper: clsx(classes.drawerPaper, !open && classes.drawerPaperClose),
                    }}
                    open={open}
                >
                    <div className={classes.toolbarIcon}>
                        <IconButton onClick={handleDrawerClose}>
                            <ChevronLeftIcon />
                        </IconButton>
                    </div>
                    <Divider />
                    <List>
                        <ListItemRouterLink to="/dashboard" primary="Dashboard">
                            <DashboardIcon />
                        </ListItemRouterLink>
                        <ListItemRouterLink to="/uploads" primary="Upload">
                            <UploadIcon />
                        </ListItemRouterLink>
                        <ListItemRouterLink to="/datasets" primary="Datasets">
                            <PeopleIcon />
                        </ListItemRouterLink>
                        <ListItemRouterLink to="/analysis" primary="Analyses">
                            <ShowChartIcon />
                        </ListItemRouterLink>
                        <ListItemRouterLink to="/settings" primary="Settings">
                            <SettingsIcon />
                        </ListItemRouterLink>
                        <ListItemRouterLink to="/admin" primary="Admin">
                            <VerifiedUserIcon />
                        </ListItemRouterLink>
                    </List>
                    <Divider />
                    <div className={classes.bottomItems}>
                        <List>
                            <ListItem button onClick={signout}>
                                <ListItemIcon><MeetingRoomIcon /></ListItemIcon>
                                <ListItemText primary="Sign out" />
                            </ListItem>
                        </List>
                    </div>
                </Drawer>
                <Switch>
                    <Route path="/admin" render={() => {setPageName("Admin"); return <Admin />}} />
                    <Route path="/analysis/:analysis_id" render={() => {setPageName("Analyses"); return <Analysis />}} />
                    <Route path="/analysis" render={() => {setPageName("Analyses"); return <Analysis />}} />
                    <Route path="/datasets" render={() => {setPageName("Datasets"); return <Datasets />}}  />
                    <Route path="/uploads" render={() => {setPageName("Upload"); return <Uploads />}}  />
                    <Route path="/settings" render={() => {setPageName("Settings"); return <Settings username={username} />}} />
                    <Route path={["/", "/dashboard"]} render={() => {setPageName("Dashboard"); return <Dashboard />}}  />
                </Switch>
            </BrowserRouter>
        </div>
    );
}
