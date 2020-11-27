import React from "react";
import clsx from "clsx";
import { BrowserRouter, Switch, Route } from "react-router-dom";
import {
    makeStyles,
    CssBaseline,
    Drawer,
    AppBar,
    Toolbar,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Typography,
    Divider,
    IconButton,
    Tooltip,
    Switch as MuiSwitch,
} from "@material-ui/core";
import {
    Menu as MenuIcon,
    ChevronLeft as ChevronLeftIcon,
    Dns as DnsIcon,
    People as PeopleIcon,
    Settings as SettingsIcon,
    ShowChart as ShowChartIcon,
    MeetingRoom as MeetingRoomIcon,
    VerifiedUser as VerifiedUserIcon,
    AccountCircle as AccountCircleIcon,
    AddBox,
    Brightness3,
    Brightness5,
} from "@material-ui/icons";

import Participants from "./participants/Participants";
import Analyses from "./analysis/Analyses";
import Datasets from "./datasets/Datasets";
import AddParticipants from "./addParticipants/AddParticipants";
import Settings from "./settings/Settings";
import Admin from "./admin/Admin";
import ListItemRouterLink from "./ListItemRouterLink";
import NotificationPopover from "./NotificationPopover";

const drawerWidth = 200;

const useStyles = makeStyles(theme => ({
    root: {
        display: "flex",
        height: "100%",
    },
    toolbarIcon: {
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        padding: theme.spacing(0, 1),
        ...theme.mixins.toolbar,
    },
    appBar: {
        zIndex: theme.zIndex.drawer + 1,
        transition: theme.transitions.create(["width", "margin"], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
        }),
    },
    appBarShift: {
        marginLeft: drawerWidth,
        width: `calc(100% - ${drawerWidth}px)`,
        transition: theme.transitions.create(["width", "margin"], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
        }),
    },
    toolbar: {
        paddingLeft: theme.spacing(3),
        paddingRight: theme.spacing(3),
    },
    toolbarShift: {
        paddingLeft: theme.spacing(2),
        paddingRight: theme.spacing(3),
    },
    menuButton: {
        marginRight: theme.spacing(4),
    },
    menuButtonHidden: {
        marginRight: theme.spacing(3),
        display: "none",
    },
    title: {
        flexGrow: 1,
    },
    drawerPaper: {
        position: "relative",
        width: drawerWidth,
        transition: theme.transitions.create("width", {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
        }),
    },
    drawerPaperClose: {
        overflowX: "hidden",
        transition: theme.transitions.create("width", {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
        }),
        width: theme.spacing(7),
    },
    bottomItems: {
        marginTop: "auto",
    },
}));

export interface NavigationProps {
    signout: () => void;
    username: string;
    lastLoginTime: string;
    darkMode: boolean;
    toggleDarkMode: () => void;
}

export default function Navigation({
    username,
    signout,
    lastLoginTime,
    darkMode,
    toggleDarkMode,
}: NavigationProps) {
    const classes = useStyles();
    const [open, setOpen] = React.useState(false);
    const [pageName, setPageName] = React.useState("Participants");

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
                <AppBar
                    position="absolute"
                    className={clsx(classes.appBar, open && classes.appBarShift)}
                >
                    <Toolbar
                        disableGutters
                        className={open ? classes.toolbar : classes.toolbarShift}
                    >
                        <IconButton
                            edge="start"
                            color="inherit"
                            aria-label="open drawer"
                            onClick={handleDrawerOpen}
                            className={open ? classes.menuButtonHidden : classes.menuButton}
                        >
                            <MenuIcon />
                        </IconButton>
                        <Typography
                            component="h1"
                            variant="h6"
                            color="inherit"
                            noWrap
                            className={classes.title}
                        >
                            {pageName}
                        </Typography>
                        <Tooltip title={darkMode ? "Disable dark mode" : "Enable dark mode"} arrow>
                            <MuiSwitch
                                checked={darkMode}
                                onChange={toggleDarkMode}
                                color="default"
                                checkedIcon={<Brightness3 />}
                                icon={<Brightness5 />}
                            />
                        </Tooltip>
                        <NotificationPopover lastLoginTime={lastLoginTime} />
                        <Tooltip title={"Logged in as " + username} arrow>
                            <AccountCircleIcon fontSize="large" />
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
                        <ListItemRouterLink to="/participants" primary="Participants">
                            <PeopleIcon />
                        </ListItemRouterLink>
                        <ListItemRouterLink to="/addParticipants" primary="Add Participants">
                            <AddBox />
                        </ListItemRouterLink>
                        <ListItemRouterLink to="/datasets" primary="Datasets">
                            <DnsIcon />
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
                                <ListItemIcon>
                                    <MeetingRoomIcon />
                                </ListItemIcon>
                                <ListItemText primary="Sign out" />
                            </ListItem>
                        </List>
                    </div>
                </Drawer>
                <Switch>
                    <Route
                        path="/admin"
                        render={() => {
                            setPageName("Admin");
                            return <Admin />;
                        }}
                    />
                    <Route
                        path="/analysis/:id?"
                        render={() => {
                            setPageName("Analyses");
                            return <Analyses />;
                        }}
                    />
                    <Route
                        path="/datasets/:id?"
                        render={() => {
                            setPageName("Datasets");
                            return <Datasets />;
                        }}
                    />
                    <Route
                        path="/addParticipants"
                        render={() => {
                            setPageName("Add Participants");
                            return <AddParticipants />;
                        }}
                    />
                    <Route
                        path="/settings"
                        render={() => {
                            setPageName("Settings");
                            return <Settings username={username} />;
                        }}
                    />
                    <Route
                        path={["/participants/:id?", "/"]}
                        render={() => {
                            setPageName("Participants");
                            return <Participants />;
                        }}
                    />
                </Switch>
            </BrowserRouter>
        </div>
    );
}
