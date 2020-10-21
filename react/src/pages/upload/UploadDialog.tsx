import React from 'react';

import { makeStyles } from '@material-ui/core/styles';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    Typography,
    Button,
    ButtonGroup,
    ExpansionPanel,
    ExpansionPanelDetails,
    ExpansionPanelSummary,
    Tabs,
    Tab,
    Grid
} from '@material-ui/core';
import { Description, ExpandMore } from '@material-ui/icons';

import FilesTable from './FilesTable';
import UploadForm from './UploadForm';


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

export default function UploadDialog({ open, onClose }: UploadDialogProps) {
    const classes = useStyles();
    const [tab, changeTab] = React.useState(0);

    let tabContent;
    if (tab === 0) {
        tabContent = <UploadForm />
    }
    else {
        tabContent = <Button variant="outlined"> Upload Excel Sample Sheet <Description/> </Button>
    }

    return (
        <Dialog
            open={open}
            onClose={() => onClose()}
            fullWidth={true}
            maxWidth='md'
        >
            <DialogTitle>
                Enter Sample Metadata
            </DialogTitle>
            <DialogContent dividers className={classes.dialog}>
                <Tabs
                    value={tab}
                    className={classes.tabs}
                    onChange={(event: React.ChangeEvent<{}>, newTab: number) => changeTab(newTab)}
                >
                    <Tab label="Form Entry" />
                    <Tab label="Excel Entry" />
                </Tabs>
                <Grid container className={classes.tabPanel}>
                    <Grid item xs={12} className={classes.gridItem} >
                        {tabContent}
                    </Grid>
                    <Grid item xs={12} className={classes.gridItem}>
                        <ExpansionPanel >
                            <ExpansionPanelSummary expandIcon={<ExpandMore />}>
                                <Typography>Link to Existing Dataset</Typography>
                            </ExpansionPanelSummary>
                            <ExpansionPanelDetails>
                                <FilesTable />
                            </ExpansionPanelDetails>
                        </ExpansionPanel>
                    </Grid>
                    <Grid item xs={10}></Grid>
                    <Grid item xs={2} className={classes.gridItem} >
                        <ButtonGroup variant="contained">
                            <Button onClick={onClose}>Cancel</Button>
                            <Button onClick={onClose} color="primary">Add</Button>
                        </ButtonGroup>
                    </Grid>
                </Grid>
            </DialogContent>
        </Dialog>
    )
}
