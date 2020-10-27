import React, { useEffect, useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Dialog, DialogTitle, DialogContent, Typography, IconButton, } from '@material-ui/core';
import { Close } from '@material-ui/icons';
import { Dataset, Analysis, Sample } from '../utils';
import { AnalysisListSection, DatasetDetailSection, SampleDetailSection } from './DialogSections';

const useStyles = makeStyles(theme => ({
    datasetInfo: {
        paddingLeft: theme.spacing(2),
        paddingRight: theme.spacing(2),
    },
    paper: {
        padding: theme.spacing(2),
        marginBottom: theme.spacing(3),
    },
    listPaper: {
        padding: theme.spacing(1),
        margin: theme.spacing(1)
    },
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
    grid: {
        paddingBottom: theme.spacing(2)
    },
    box: {
        padding: theme.spacing(2),
        margin: theme.spacing(1)
    }
}));

interface DialogTitleProps {
    id: string;
    children: React.ReactNode;
    onClose: () => void;
}

const DialogHeader = ((props: DialogTitleProps) => {
    const { children, onClose, ...other } = props;
    const classes = useStyles();
    return (
        <DialogTitle disableTypography className={classes.root} {...other}>
            <Typography variant="h6">{children}</Typography>
            {onClose ? (
                <IconButton aria-label="close" className={classes.closeButton} onClick={onClose}>
                    <Close />
                </IconButton>
            ) : null}
        </DialogTitle>
    );
});

interface DialogProp {
    open: boolean,
    dataset_id: string,
    onClose: (() => void),
}

export default function DatasetInfoDialog({ dataset_id, open, onClose }: DialogProp) {
    const classes = useStyles();
    const labeledBy = "dataset-info-dialog-slide-title";

    const [dataset, setDataset] = useState<Dataset>();
    const [analyses, setAnalyses] = useState<Analysis[]>([]);
    const [sample, setSample] = useState<Sample>();

    useEffect(() => {
        fetch('/api/datasets/'+dataset_id)
        .then(response => response.json())
        .then(data => {
            setDataset(data as Dataset);
            setAnalyses(data.analyses as Analysis[]);
            setSample(data.tissue_sample as Sample);
        })
        .catch(error => {console.error(error)});

    }, [dataset_id]);

    return (
        <Dialog onClose={onClose} aria-labelledby={labeledBy} open={open} maxWidth='lg' fullWidth={true}>
            <DialogHeader id={labeledBy} onClose={onClose}>
                Details of Dataset ID {dataset_id}
            </DialogHeader>
            <DialogContent className={classes.datasetInfo} dividers>
                <DatasetDetailSection dataset={dataset} />
                <SampleDetailSection sample={sample} />
                <AnalysisListSection analyses={analyses} />
            </DialogContent>
        </Dialog>
    );
}
