import React from "react";
import clsx from "clsx";
import { BrowserRouter, Switch, Route, RouteProps } from "react-router-dom";
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
    Brightness3,
    Brightness5,
    AddBox as AddBoxIcon,
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

const useStyles = (darkMode: boolean) =>
    makeStyles(theme => ({
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
            backgroundColor: darkMode ? "#383838" : "inherit",
        },
        drawerPaperClose: {
            overflowX: "hidden",
            transition: theme.transitions.create("width", {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.leavingScreen,
            }),
            width: theme.spacing(7),
            backgroundColor: darkMode ? "#383838" : "inherit",
        },
        bottomItems: {
            marginTop: "auto",
        },
    }));

interface RouteItem extends RouteProps {
    pageName: string; // Displays in AppBar
    linkTo?: string; // Used as path for links
    main: (props: any) => JSX.Element; // The page itself
    icon?: React.ReactElement; // Icon for menu links
}

/**
 * List of all routes in the application.
 * The order determines the link order in the Drawer.
 *
 * Note: if path is an array or has parameters, make sure that
 * linkTo is defined to a 'default' that sidebar links will point to.
 */
const routes: RouteItem[] = [
    {
        pageName: "Participants",
        path: ["/participants/:id?", "/"],
        linkTo: "/participants",
        main: Participants,
        icon: <PeopleIcon />,
        exact: true,
    },
    {
        pageName: "Add Participants",
        path: "/addParticipants",
        main: AddParticipants,
        icon: <AddBoxIcon />,
    },
    {
        pageName: "Datasets",
        path: "/datasets/:id?",
        linkTo: "/datasets",
        main: Datasets,
        icon: <DnsIcon />,
    },
    {
        pageName: "Analyses",
        path: "/analysis/:id?",
        linkTo: "/analysis",
        main: Analyses,
        icon: <ShowChartIcon />,
    },
    {
        pageName: "Settings",
        path: "/settings",
        main: Settings,
        icon: <SettingsIcon />,
    },
    {
        pageName: "Admin",
        path: "/admin",
        main: Admin,
        icon: <VerifiedUserIcon />,
    },
];

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
    const classes = useStyles(darkMode)();
    const [open, setOpen] = React.useState(localStorage.getItem("drawerOpen") === "true");

    const handleDrawerOpen = () => {
        setOpen(true);
        localStorage.setItem("drawerOpen", String(true));
    };
    const handleDrawerClose = () => {
        setOpen(false);
        localStorage.setItem("drawerOpen", String(false));
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
                        <Switch>
                            {routes.map((route, index) => (
                                <Route key={index} path={route.path} exact={route.exact}>
                                    <Typography
                                        component="h1"
                                        variant="h6"
                                        color="inherit"
                                        noWrap
                                        className={classes.title}
                                    >
                                        {route.pageName}
                                    </Typography>
                                </Route>
                            ))}
                        </Switch>
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
                        {routes.map((route, index) => (
                            <ListItemRouterLink
                                key={index}
                                to={route.linkTo ? route.linkTo : "" + route.path}
                                primary={route.pageName}
                                children={route.icon}
                            />
                        ))}
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
                    {routes.map((route, index) => (
                        <Route
                            key={index}
                            path={route.path}
                            exact={route.exact}
                            render={() => {
                                switch (route.path) {
                                    case "/settings":
                                        return <route.main username={username} />;
                                    default:
                                        return <route.main />;
                                }
                            }}
                        />
                    ))}
                </Switch>
            </BrowserRouter>
        </div>
    );
}
