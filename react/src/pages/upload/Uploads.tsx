import React, { useEffect, useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Box from '@material-ui/core/Box';
import Container from '@material-ui/core/Container';
import Grid from '@material-ui/core/Grid';
import Link from '@material-ui/core/Link';
import Paper from '@material-ui/core/Paper';

import Card from '../participants/Card';
import FilesTable from './FilesTable';
import UploadersTable from './UploadersTable';

enum TableType {
    FILES,
    UPLOADERS,
}

const useStyles = makeStyles(theme => ({
    root: {
        display: 'fill',
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
}));

function renderTable(displayTable: TableType) {
    switch (displayTable) {
        case TableType.FILES:
            return <FilesTable />;
        case TableType.UPLOADERS:
            return <UploadersTable />;
    }
}


export default function Uploads() {
    const classes = useStyles();
    const [tableType, setTableType] = useState(TableType.FILES);

    useEffect(() => {
        document.title = "Upload | ST2020";
    }, []);

    return (
        <main className={classes.content}>
            <div className={classes.appBarSpacer} />
            <Container maxWidth="lg" className={classes.container}>
                <Grid container spacing={2}>
                    <Grid item xs={4}>
                        <Paper className={classes.paper}>
                            <Card title="Unlinked files" value="17" textSecondary="2 since last week" linkText="" children={
                                <Link color="primary" href="#" onClick={() => { setTableType(TableType.FILES); console.log(tableType) }}>
                                    View unlinked files
                                </Link>
                            } />
                        </Paper>
                    </Grid>
                    <Grid item xs={4}>
                        <Paper className={classes.paper}>
                            <Card title="Uploaders" value="5" textSecondary="Avg 12 files per week" linkText="" children={
                                <Link color="primary" href="#" onClick={() => { setTableType(TableType.UPLOADERS); console.log(tableType) }}>
                                    Manage uploaders
                                </Link>
                            } />
                        </Paper>
                    </Grid>
                    <Grid item xs={12}>
                        <Box alignItems="stretch">
                            {renderTable(tableType)}
                        </Box>
                    </Grid>
                </Grid>
            </Container>
        </main>

    );
}
