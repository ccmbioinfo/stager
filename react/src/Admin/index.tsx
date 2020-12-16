import React from "react";
import { makeStyles, Theme, AppBar, Tabs, Tab, Typography, Box } from "@material-ui/core";
import UserList from "./components/UserList";
import ManagedUploaders from "./components/ManagedUploaders";

interface TabPanelProps {
    children?: React.ReactNode;
    index: any;
    value: any;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`simple-tabpanel-${index}`}
            aria-labelledby={`simple-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box p={3}>
                    <Typography>{children}</Typography>
                </Box>
            )}
        </div>
    );
}

function a11yProps(index: any) {
    return {
        id: `simple-tab-${index}`,
        "aria-controls": `simple-tabpanel-${index}`,
    };
}

const useStyles = makeStyles((theme: Theme) => ({
    root: {
        flexGrow: 1,
        overflow: "auto",
    },
    appBarSpacer: theme.mixins.toolbar,
}));

export default function Admin() {
    const classes = useStyles();
    const [currentTab, setCurrentTab] = React.useState(0);

    return (
        <Box className={classes.root}>
            <div className={classes.appBarSpacer} />
            <AppBar position="static">
                <Tabs
                    value={currentTab}
                    onChange={(e, tab) => setCurrentTab(tab)}
                    aria-label="admin-tabs"
                >
                    <Tab label="Manage Users" {...a11yProps(0)} />
                    <Tab label="Manage Uploaders" {...a11yProps(1)} />
                </Tabs>
            </AppBar>
            <TabPanel value={currentTab} index={0}>
                <UserList />
            </TabPanel>
            <TabPanel value={currentTab} index={1}>
                <ManagedUploaders />
            </TabPanel>
        </Box>
    );
}
