import React, { useEffect, useState } from 'react';
import { createStyles, Theme, withStyles, WithStyles } from '@material-ui/core/styles';
import Dialog from '@material-ui/core/Dialog';
import MuiDialogTitle from '@material-ui/core/DialogTitle';
import MuiDialogContent from '@material-ui/core/DialogContent';
import IconButton from '@material-ui/core/IconButton';
import CloseIcon from '@material-ui/icons/Close';
import Typography from '@material-ui/core/Typography';
import DatasetTable from './analysis/DatasetTable';
import { Analysis, Dataset, FieldDisplay } from './utils';
import ChipStrip from './analysis/ChipStrip';

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

const pipelineParams: string[] = ["gnomAD_AF <= 0.01", "trio", "joint_genotyping", "denovo", "IMPACT_SEVERITY=HIGH",]
const analyses: string[] = ["SNP", "INDELs",]
export const annotations: string[] = ["OMIM 2020-07-01", "HGMD 2019-02-03", "snpEff 4.3T", "gnomAD v2.1.1"]

export default function AnalysisInfoDialog({ analysis, open, onClose }: AlertInfoDialogProp) {

    const [datasets, setDatasets] = useState<Dataset[]>([]);
    const [pipeline, setPipeline] = useState();
    const labeledBy = "analysis-info-dialog-slide-title"

    useEffect(() => {
        fetch('/api/analyses/'+analysis.analysis_id)
        .then(response => response.json())
        .then(data => {
            setDatasets(data.datasets);
            setPipeline(data.pipeline);
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
                <FieldDisplay title="Pipeline ID" value={analysis.pipeline_id} variant="h6" />
                <ChipStrip labels={analyses} color="primary" />
                <ChipStrip labels={pipelineParams} color="secondary" />
                <ChipStrip labels={annotations} color="default" />
                <Typography variant="h6" gutterBottom>
                    Samples
                </Typography>
                <DatasetTable/>
            </DialogContent>
        </Dialog>
  );
}
