import React from 'react';
import clsx from 'clsx';
import { BrowserRouter, Switch, Route } from 'react-router-dom';
import { makeStyles } from '@material-ui/core/styles';
import CssBaseline from '@material-ui/core/CssBaseline';
import Drawer from '@material-ui/core/Drawer';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import Typography from '@material-ui/core/Typography';
import Divider from '@material-ui/core/Divider';
import IconButton from '@material-ui/core/IconButton';
import MenuIcon from '@material-ui/icons/Menu';
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft';
import DashboardIcon from '@material-ui/icons/Dashboard';
import PeopleIcon from '@material-ui/icons/People';
import UploadIcon from '@material-ui/icons/Publish';
import SettingsIcon from '@material-ui/icons/Settings';
import ShowChartIcon from '@material-ui/icons/ShowChart';
import MeetingRoomIcon from '@material-ui/icons/MeetingRoom';
import VerifiedUserIcon from '@material-ui/icons/VerifiedUser';
import AccountCircleIcon from '@material-ui/icons/AccountCircle';
import Tooltip from '@material-ui/core/Tooltip';

import Dashboard from './dashboard/Dashboard';
import Analysis from './analysis/Analysis';
import Participants from './participants/Participants';
import Uploads from './upload/Uploads';
import Settings from './settings/Settings';
import Admin from './admin/Admin';
import ListItemRouterLink from './ListItemRouterLink';

const drawerWidth = 240;

const useStyles = makeStyles(theme => ({
    root: {
        display: 'flex',
        height: '100%',
    },
    toolbar: {
        paddingRight: 24, // keep right padding when drawer closed
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
    menuButton: {
        marginRight: 36,
    },
    menuButtonHidden: {
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
        [theme.breakpoints.up('sm')]: {
            width: theme.spacing(9),
        },
    },
    appBarSpacer: theme.mixins.toolbar,
    content: {
        flexGrow: 1,
        height: '100vh',
        overflow: 'auto',
    },
    container: {
        paddingTop: theme.spacing(3),
        paddingBottom: theme.spacing(3),
    },
    paper: {
        padding: theme.spacing(2),
        display: 'flex',
        overflow: 'auto',
        flexDirection: 'column',
    },
    fixedHeight: {
        height: 240,
    },
    bottomItems: {
        marginTop: 'auto',
    },
    icon: {
        paddingLeft: theme.spacing(1)
    }
}));

export interface NavigationProps {
    signout: () => void;
    username: string;
}

export default function Navigation({ username, signout }: NavigationProps) {
    const classes = useStyles();
    const [open, setOpen] = React.useState(true);
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
                    <Toolbar className={classes.toolbar}>
                        <IconButton
                            edge="start"
                            color="inherit"
                            aria-label="open drawer"
                            onClick={handleDrawerOpen}
                            className={clsx(classes.menuButton, open && classes.menuButtonHidden)}
                        >
                            <MenuIcon />
                        </IconButton>
                        <Typography component="h1" variant="h6" color="inherit" noWrap className={classes.title}>
                            ST2020
                        </Typography>
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
                        <ListItemRouterLink to="/participants" primary="Participants">
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
                    <Route path="/admin" component={Admin} />
                    <Route path="/analysis/:analysisID" component={Analysis} />
                    <Route path="/analysis" component={Analysis} />
                    <Route path="/participants" component={Participants} />
                    <Route path="/uploads" component={Uploads} />
                    <Route path="/settings">
                        <Settings username={username} />
                    </Route>
                    <Route path={["/", "/dashboard"]} component={Dashboard} />
                </Switch>
            </BrowserRouter>
        </div>
    );
}
