import React from 'react';

import { makeStyles } from '@material-ui/core/styles';
import { Dialog, DialogTitle, DialogContent, Button, ButtonGroup, Tabs, Tab, Grid } from '@material-ui/core';
import UploadForm from './UploadForm';
import { InputFileUpload } from './UploadCSV';

interface UploadDialogProps {
    open: boolean,
    onClose: (() => void),
}

const useStyles = makeStyles(theme => ({
    root: {
    },
    dialog: {
        paddingBottom: theme.spacing(2),
        paddingTop: theme.spacing(0),
        paddingLeft: theme.spacing(0),
        paddingRight: theme.spacing(0),
    },
    margin: {
        margin: theme.spacing(1),
    },
    padding: {
        paddingTop: theme.spacing(4),
    },
    tabs: {
        paddingTop: theme.spacing(0),
    },
    tabPanel: {
        padding: theme.spacing(1),
    },
    gridItem: {
        padding: theme.spacing(1)
    },
    buttonGroup: {
        paddingRight: theme.spacing(1)
    }
}));

function sendFile(file: File | null) {
    if (file !== null) {
        // Upload
        fetch('/api/_bulk', {
            method: 'POST',
            body: file,
            headers: new Headers({
                'Content-Type': 'text/csv'
            })
        })
        .then(response => response.json())
        .then(data => {
            console.log(data);
        })
        .catch(error => {
            console.error(error);
        })
    }
}

export default function UploadDialog({ open, onClose }: UploadDialogProps) {
    const classes = useStyles();
    const [tab, changeTab] = React.useState(0);
    const [file, setFile] = React.useState<File | null>(null);

    // File reference gets set here
    function onUpload(files: FileList | null) {
        if (files && files[0]) {
            setFile(files[0]);
            console.log(files[0].name);
        }
        else {
            setFile(null);
        }
    }

    let tabContent;
    if (tab == 1) {
        tabContent = (<UploadForm />);
    }
    else {
        tabContent = (
        <>
            <InputFileUpload onUpload={onUpload} />
        </>
        );
    }

    return (
        <Dialog
            open={open}
            onClose={() => onClose()}
            fullWidth={true}
            maxWidth='md'
        >
            <DialogTitle>
                Upload Sample Data
            </DialogTitle>
            <DialogContent dividers className={classes.dialog}>
                <Tabs
                    value={tab}
                    className={classes.tabs}
                    onChange={(event: React.ChangeEvent<{}>, newTab: number) => changeTab(newTab)}
                >
                    <Tab label="CSV Upload" />
                    <Tab label="Manual Form Entry" />
                </Tabs>
                <Grid container className={classes.tabPanel}>
                    <Grid item xs={12} className={classes.gridItem} >
                        {tabContent}
                    </Grid>
                    <Grid item xs={10}></Grid>
                    <Grid item xs={2} className={classes.gridItem} >
                        <ButtonGroup variant="contained">
                            <Button onClick={onClose}>Cancel</Button>
                            <Button onClick={() => {sendFile(file); onClose()}} color="primary">Add</Button>
                        </ButtonGroup>
                    </Grid>
                </Grid>
            </DialogContent>
        </Dialog>
    )
}
