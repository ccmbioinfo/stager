import React, { useEffect, useState } from "react";
import {
    List,
    ListItemIcon,
    ListItem,
    Paper,
    ListItemText,
    Collapse,
    Dialog,
    IconButton,
    Typography,
    Grid,
    Divider,
} from "@material-ui/core";
import MuiDialogTitle from "@material-ui/core/DialogTitle";
import MuiDialogContent from "@material-ui/core/DialogContent";
import { createStyles, makeStyles, Theme, withStyles, WithStyles } from "@material-ui/core/styles";
import { Dns, ExpandLess, ExpandMore, Close } from "@material-ui/icons";
import { formatDateString } from "./utils/functions";
import { Analysis, Dataset, Pipeline } from "./utils/typings";
import { DialogHeader, FieldDisplay } from "./utils/components";
import { DatasetDetailSection } from "./datasets/DialogSections";

interface AlertInfoDialogProp {
    open: boolean;
    analysis: Analysis;
    onClose: () => void;
}

const styles = (theme: Theme) =>
    createStyles({
        root: {
            margin: 0,
            padding: theme.spacing(2),
        },
        closeButton: {
            position: "absolute",
            right: theme.spacing(1),
            top: theme.spacing(1),
            color: theme.palette.grey[500],
        },
    });

export interface DialogTitleProps extends WithStyles<typeof styles> {
    id: string;
    children: React.ReactNode;
    onClose: () => void;
}

const DialogTitle = withStyles(styles)((props: DialogTitleProps) => {
    const { children, classes, onClose, ...other } = props;
    return (
        <MuiDialogTitle disableTypography className={classes.root} {...other}>
            <Typography variant="h6">{children}</Typography>
            {onClose ? (
                <IconButton aria-label="close" className={classes.closeButton} onClick={onClose}>
                    <Close />
                </IconButton>
            ) : null}
        </MuiDialogTitle>
    );
});

const DialogContent = withStyles((theme: Theme) => ({
    root: {
        padding: theme.spacing(2),
    },
}))(MuiDialogContent);

const useStyles = makeStyles(theme => ({
    paper: {
        padding: theme.spacing(2),
    },
    listPaper: {
        padding: theme.spacing(1),
        margin: theme.spacing(1),
    },
    box: {
        padding: theme.spacing(2),
        margin: theme.spacing(1),
    },
    dialogContent: {
        padding: theme.spacing(0),
        margin: theme.spacing(0),
    },
    infoSection: {
        margin: theme.spacing(3),
    },
    datasetInfo: {
        padding: theme.spacing(2),
    },
}));

export default function AnalysisInfoDialog({ analysis, open, onClose }: AlertInfoDialogProp) {
    const classes = useStyles();

    const [datasets, setDatasets] = useState<Dataset[]>([]);
    const [pipeline, setPipeline] = useState<Pipeline>();
    const labeledBy = "analysis-info-dialog-slide-title";

    useEffect(() => {
        fetch("/api/analyses/" + analysis.analysis_id)
            .then(response => response.json())
            .then(data => {
                setDatasets(data.datasets);
                setPipeline(data.pipeline);
            })
            .catch(error => {});
    }, [analysis]);

    return (
        <Dialog
            onClose={onClose}
            aria-labelledby={labeledBy}
            open={open}
            maxWidth="md"
            fullWidth={true}
        >
            <DialogHeader id={labeledBy} onClose={onClose}>
                Details of Analysis ID {analysis.analysis_id}
            </DialogHeader>
            <DialogContent className={classes.dialogContent} dividers>
                <div className={classes.infoSection}>
                    <Grid container spacing={2} justify="space-evenly">
                        <Grid item xs={6}>
                            <FieldDisplay title="Assigned to" value={analysis.assignee} />
                            <FieldDisplay title="Requested by" value={analysis.requester} />
                            <FieldDisplay title="Status" value={analysis.analysis_state} />
                            <FieldDisplay
                                title="Last Updated"
                                value={formatDateString(analysis.updated)}
                            />
                            <FieldDisplay title="Notes" value={analysis.notes} />
                        </Grid>
                        <Grid item xs={6}>
                            <FieldDisplay
                                title="Pipeline"
                                value={`${pipeline?.pipeline_name} ${pipeline?.pipeline_version}`}
                                variant="h6"
                            />
                            <FieldDisplay title="Pipeline ID" value={analysis.pipeline_id} />
                            <FieldDisplay
                                title="Supported Types"
                                value={pipeline?.supported_types}
                            />
                        </Grid>
                    </Grid>
                </div>
                <Divider />
                <div className={classes.infoSection}>
                    {datasets.length > 0 && <DatasetList datasets={datasets} showTitle />}
                </div>
            </DialogContent>
        </Dialog>
    );
}

interface DatasetListProp {
    datasets: Dataset[];
    showTitle: boolean;
}
function DatasetList({ datasets, showTitle }: DatasetListProp) {
    const [showDatasets, setShowDatasets] = useState<boolean[]>([]);
    const classes = useStyles();

    function clickDataset(index: number) {
        setShowDatasets(showDatasets.map((value, i) => (i === index ? !value : value)));
    }
    useEffect(() => {
        setShowDatasets(datasets.map(val => false));
    }, [datasets]);

    return (
        <>
            {showTitle && <Typography variant="h6">Associated Datasets</Typography>}

            <List>
                {datasets.map((dataset, index) => (
                    <Paper key={`analysis-${index}`} className={classes.listPaper} elevation={1}>
                        <ListItem button onClick={() => clickDataset(index)}>
                            <ListItemIcon>
                                <Dns />
                            </ListItemIcon>
                            <ListItemText
                                primary={`Dataset ID ${dataset.dataset_id}`}
                                secondary={`Participant: ${dataset.participant_codename} - Click for more details`}
                            />
                            {showDatasets[index] ? <ExpandLess /> : <ExpandMore />}
                        </ListItem>
                        <Collapse in={showDatasets[index]}>
                            <div className={classes.datasetInfo}>
                                <DatasetDetailSection dataset={dataset} elevation={0} />
                            </div>
                        </Collapse>
                    </Paper>
                ))}
            </List>
        </>
    );
}
