import React from 'react';

import { makeStyles } from '@material-ui/core/styles';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import FormControl from '@material-ui/core/FormControl';
import Input from '@material-ui/core/Input';
import InputLabel from '@material-ui/core/InputLabel';
import DialogContent from '@material-ui/core/DialogContent';
import Typography from '@material-ui/core/Typography';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import Button from '@material-ui/core/Button';
import ButtonGroup from '@material-ui/core/ButtonGroup';
import ExpansionPanel from '@material-ui/core/ExpansionPanel';
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails';
import ExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import DescriptionIcon from '@material-ui/icons/Description';

import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import Grid from '@material-ui/core/Grid';
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
    if (tab == 0) {
        tabContent = <UploadForm />
    }
    else {
        tabContent = <Button variant="outlined"> Upload Excel Sample Sheet <DescriptionIcon/> </Button>
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
                            <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
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
