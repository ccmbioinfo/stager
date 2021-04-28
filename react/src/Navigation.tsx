import React, { useState, useMemo } from "react";
import {
    makeStyles,
    CssBaseline,
    Drawer,
    AppBar,
    Toolbar,
    List,
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
    Search as SearchIcon,
    Settings as SettingsIcon,
    ShowChart as ShowChartIcon,
    MeetingRoom as MeetingRoomIcon,
    VerifiedUser as VerifiedUserIcon,
    AccountCircle as AccountCircleIcon,
    Brightness3,
    Brightness5,
    AddBox as AddBoxIcon,
    SupervisedUserCircle,
} from "@material-ui/icons";
import clsx from "clsx";
import { BrowserRouter, Switch, Route, RouteProps, Redirect } from "react-router-dom";
import AddDatasets from "./AddDatasets";
import Admin from "./Admin";
import Analyses from "./Analyses";
import logo from "./assets/logo.png";
import { ListItemRouterLink, NotificationPopover } from "./components";
import { useUserContext } from "./contexts";
import Datasets from "./Datasets";
import Groups from "./Groups";
import NotFoundPage from "./NotFound";
import Participants from "./Participants";
import SearchVariants from "./SearchVariants";
import Settings from "./Settings";

const drawerWidth = 200;

const useStyles = (darkMode: boolean) =>
    useMemo(
        () =>
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
                logo: {
                    height: "2.5em",
                    width: "auto",
                    objectFit: "scale-down",
                    margin: theme.spacing(0, 2),
                },
                appBarButton: {
                    color: theme.palette.common.white,
                },
            })),
        [darkMode]
    );

interface RouteItem extends RouteProps {
    pageName: string; // Displays in AppBar
    linkTo?: string; // Used as path for links
    main: React.ComponentType; // The page itself
    icon?: React.ReactElement; // Icon for menu links
    requiresAdmin?: boolean; // If the route requires admin
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
        pageName: "Add Datasets",
        path: "/addDatasets",
        main: AddDatasets,
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
        pageName: "Variants",
        path: "/variants",
        main: SearchVariants,
        icon: <SearchIcon />,
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
        requiresAdmin: true,
    },
    {
        pageName: "Groups",
        path: "/groups",
        main: Groups,
        icon: <SupervisedUserCircle />,
        requiresAdmin: true,
    },
];

export interface NavigationProps {
    signout: () => void;
    darkMode: boolean;
    toggleDarkMode: () => void;
}

export default function Navigation({ signout, darkMode, toggleDarkMode }: NavigationProps) {
    const classes = useStyles(darkMode)();
    const [open, setOpen] = useState(localStorage.getItem("drawerOpen") === "true");
    const { user: currentUser } = useUserContext();

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
                        <NotificationPopover lastLoginTime={currentUser.last_login} />
                        <Tooltip title={"Logged in as " + currentUser.username} arrow>
                            <AccountCircleIcon fontSize="large" />
                        </Tooltip>
                        <Tooltip title="Sign out" arrow>
                            <IconButton onClick={signout} className={classes.appBarButton}>
                                <MeetingRoomIcon fontSize="large" />
                            </IconButton>
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
                        <img className={classes.logo} src={logo} alt="" />
                        <IconButton onClick={handleDrawerClose}>
                            <ChevronLeftIcon fontSize="large" />
                        </IconButton>
                    </div>
                    <Divider />
                    <List>
                        {routes.map((route, index) =>
                            !route.requiresAdmin || currentUser.is_admin ? (
                                <ListItemRouterLink
                                    key={index}
                                    to={route.linkTo ? route.linkTo : "" + route.path}
                                    primary={route.pageName}
                                    children={route.icon}
                                    hideTooltip={open}
                                />
                            ) : (
                                <React.Fragment key={index} />
                            )
                        )}
                    </List>
                </Drawer>
                <Switch>
                    {routes.map((route, index) =>
                        !route.requiresAdmin || currentUser.is_admin ? (
                            <Route
                                key={index}
                                path={route.path}
                                exact={route.exact}
                                render={() => <route.main />}
                            />
                        ) : (
                            <Redirect key={index} to="/participants" />
                        )
                    )}
                    <Route path="*" render={() => <NotFoundPage />} />
                </Switch>
            </BrowserRouter>
        </div>
    );
}
