import React, { useEffect, useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Box, Container } from '@material-ui/core';
import UploadDialog from './UploadDialog';
import DataEntryTable from './DataEntryTable';

const useStyles = makeStyles(theme => ({
    root: {
        display: "fill",
    },
    appBarSpacer: theme.mixins.toolbar,
    content: {
        flexGrow: 1,
        height: "100vh",
        overflow: "auto",
    },
    container: {
        paddingTop: theme.spacing(3),
        paddingBottom: theme.spacing(3),
    },
    paper: {
        padding: theme.spacing(2),
        display: "flex",
        overflow: "auto",
        flexDirection: "column",
    },
    addnew: {
        padding: theme.spacing(2),
        display: "flex",
        overflow: "auto",
        flexDirection: "column",
        background: "#e5e5e5",
        height: "100%",
        cursor: "pointer",
    },
    fixedHeight: {
        height: 240,
    },
}));

export default function Uploads() {
    const classes = useStyles();
    const [uploaderOpen, setUploaderOpen] = useState(false);

    useEffect(() => {
        document.title = "Upload | ST2020";
    }, []);

    return (
        <main className={classes.content}>
            <div className={classes.appBarSpacer} />
            <UploadDialog open={uploaderOpen} onClose={() => setUploaderOpen(false)} />
            <Container maxWidth="xl" className={classes.container}>
                <Box alignItems="stretch">
                    <DataEntryTable />
                </Box>
            </Container>
        </main>
    );
}
