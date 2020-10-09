import React from 'react';
import { makeStyles, Accordion, AccordionSummary, AccordionDetails, Typography, Grid } from '@material-ui/core';
import { ExpandMore } from '@material-ui/icons';
import { Dataset } from './MockData';

const useStyles = makeStyles(theme => ({
    root: {
        marginLeft: '5%',
        marginRight: '5%',
        marginTop: theme.spacing(1),
        marginBottom: theme.spacing(1),
    },
}));

const getInfo = (name: string, value: string) => {
    return (<Typography variant="body2">{name}: {value}</Typography>)
}

const getAccordion = (dataset: Dataset) => {
    return (
        <Accordion >
            <AccordionSummary expandIcon={<ExpandMore />} aria-controls="panel1a-content" id="panel1a-header">
                <Typography variant="body2">Dataset: {dataset.datasetID} [{dataset.datasetType}]</Typography>
            </AccordionSummary>
            <AccordionDetails>
                <Grid container spacing={2} justify="space-evenly">
                    <Grid item xs={6}>
                        {getInfo("Input HPF Path", dataset.inputHpfPath)}
                        {getInfo("Condition", dataset.condition)}
                        {getInfo("Extraction Protocol", dataset.extractionProtocol)}
                        {getInfo("Capture Kit", dataset.captureKit)}
                        {getInfo("Library Prep Method", dataset.libraryPrepMethod)}
                        {getInfo("Library Prep Date", dataset.libraryPrepDate)}
                        {getInfo("Read Length", dataset.readLength.toString())}
                        {getInfo("Read Type", dataset.readType)}
                    </Grid>
                    <Grid item xs={6}>
                        {getInfo("Sequencing ID", dataset.sequencingID)}
                        {getInfo("Sequencing Centre", dataset.sequencingCentre)}
                        {getInfo("Creation Time", dataset.created)}
                        {getInfo("Created By", dataset.createdBy.toString())}
                        {getInfo("Update Time", dataset.updated)}
                        {getInfo("Updated By", dataset.updatedBy.toString())}
                        {getInfo("Discriminator", dataset.discriminator)}
                    </Grid>
                </Grid>
            </AccordionDetails>
        </Accordion>
    )
}

interface DatasetAccordionProp {
    datasets: Dataset[],
}

export default function DatasetAccordion({ datasets }: DatasetAccordionProp) {
    const classes = useStyles();
    
    return (
        <div className={classes.root}>
            {
                datasets.length === 0 ? (<Typography variant="body2" align="center">No records to display</Typography>) :
                                        (datasets.map(dataset => getAccordion(dataset)))
            }
        </div>
    );
}