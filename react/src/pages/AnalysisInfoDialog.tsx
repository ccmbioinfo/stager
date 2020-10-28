import React, { useEffect, useState } from 'react';
import { createStyles, makeStyles, Theme, withStyles, WithStyles } from '@material-ui/core/styles';
import Dialog from '@material-ui/core/Dialog';
import MuiDialogTitle from '@material-ui/core/DialogTitle';
import MuiDialogContent from '@material-ui/core/DialogContent';
import IconButton from '@material-ui/core/IconButton';
import CloseIcon from '@material-ui/icons/Close';
import Typography from '@material-ui/core/Typography';
import { Analysis, Dataset, FieldDisplay, Pipeline } from './utils';
import { List, ListItemIcon, ListItem, Paper, ListItemText, Collapse } from '@material-ui/core';
import { Dns, ExpandLess, ExpandMore } from '@material-ui/icons';
import { DatasetDetailSection } from './datasets/DialogSections';

interface AlertInfoDialogProp {
    open: boolean,
    analysis: Analysis,
    onClose: (() => void),
}

const styles = (theme: Theme) =>
    createStyles({
        root: {
            margin: 0,
            padding: theme.spacing(2),
        },
        closeButton: {
            position: 'absolute',
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
                    <CloseIcon />
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
        marginBottom: theme.spacing(3),
    },
    listPaper: {
        padding: theme.spacing(1),
        margin: theme.spacing(1)
    },
    grid: {
        paddingBottom: theme.spacing(2)
    },
    box: {
        padding: theme.spacing(2),
        margin: theme.spacing(1)
    }
}));

const pipelineParams: string[] = ["gnomAD_AF <= 0.01", "trio", "joint_genotyping", "denovo", "IMPACT_SEVERITY=HIGH",]
const analyses: string[] = ["SNP", "INDELs",]
export const annotations: string[] = ["OMIM 2020-07-01", "HGMD 2019-02-03", "snpEff 4.3T", "gnomAD v2.1.1"]

export default function AnalysisInfoDialog({ analysis, open, onClose }: AlertInfoDialogProp) {

    const classes = useStyles();

    const [datasets, setDatasets] = useState<Dataset[]>([]);
    const [pipeline, setPipeline] = useState<Pipeline>();
    const [showDataset, setShowDataset] = useState<boolean[]>([]);
    const labeledBy = "analysis-info-dialog-slide-title";

    function clickDataset(index: number) {
        setShowDataset(showDataset.map((value, i) => i === index ? !value : value));
    }

    useEffect(() => {
        fetch('/api/analyses/'+analysis.analysis_id)
        .then(response => response.json())
        .then(data => {
            setDatasets(data.datasets);
            setPipeline(data.pipeline);
            setShowDataset(data.datasets.map(() => false));
        })
        .catch(error => {

        });
    }, [analysis]);

    return (
        <Dialog onClose={onClose} aria-labelledby={labeledBy} open={open} maxWidth='md' fullWidth={true}>
            <DialogTitle id={labeledBy} onClose={onClose}>
                <FieldDisplay title="Analysis" value={analysis.analysis_id} variant="h6" />
                <FieldDisplay title="Assigned to" value={analysis.assignee} />
                <FieldDisplay title="Requested by" value={analysis.requester} />
                <FieldDisplay title="Status" value={analysis.analysis_state} />
                <FieldDisplay title="Last Updated" value={analysis.updated} />
                <FieldDisplay title="Notes" value={analysis.notes} />
            </DialogTitle>
            <DialogContent dividers>
                <FieldDisplay title="Pipeline" value={`${pipeline?.pipeline_name} ${pipeline?.pipeline_version}`} variant="h6" />
                <FieldDisplay title="Pipeline ID" value={analysis.pipeline_id} />
                <FieldDisplay title="Supported Types" value={pipeline?.supported_types} />

                {datasets.length > 0 && showDataset.length === datasets.length &&
                <>
                    <Typography variant="h6">Datasets in this Analysis</Typography>
                    <List>
                    {datasets.map((dataset, index) =>
                    <Paper key={`analysis-${index}`} className={classes.listPaper} elevation={1}>
                        <ListItem button onClick={() => clickDataset(index)}>
                            <ListItemIcon>
                                <Dns />
                            </ListItemIcon>
                            <ListItemText
                            primary={`Dataset ID ${dataset.dataset_id}`}
                            secondary={`Participant: ${dataset.participant_codename} - Click for more details`}
                            />
                            {showDataset[index] ? <ExpandLess /> : <ExpandMore />}
                        </ListItem>
                        <Collapse in={showDataset[index]}>
                            <DatasetDetailSection dataset={dataset} elevation={0} />
                        </Collapse>
                    </Paper>
                    )}
                    </List>
                </>
                }
            </DialogContent>
        </Dialog>
  );
}
