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

function Entry({ name, value }: { name: string, value: string }) {
    return (<Typography variant="body2">{name}: {value}</Typography>);
}

function DatasetAccordion({ dataset }: { dataset: Dataset }) {
    return (
        <Accordion >
            <AccordionSummary expandIcon={<ExpandMore />} aria-controls="panel1a-content" id="panel1a-header">
                <Typography variant="body2">Dataset: {dataset.datasetID} [{dataset.datasetType}]</Typography>
            </AccordionSummary>
            <AccordionDetails>
                <Grid container spacing={2} justify="space-evenly">
                    <Grid item xs={6}>
                        <Entry name={"Input HPF Path"} value={dataset.inputHpfPath} />
                        <Entry name={"Condition"} value={dataset.condition} />
                        <Entry name={"Extraction Protocol"} value={dataset.extractionProtocol} />
                        <Entry name={"Capture Kit"} value={dataset.captureKit} />
                        <Entry name={"Library Prep Method"} value={dataset.libraryPrepMethod} />
                        <Entry name={"Library Prep Date"} value={dataset.libraryPrepDate} />
                        <Entry name={"Read Length"} value={dataset.readLength.toString()} />
                        <Entry name={"Read Type"} value={dataset.readType} />
                    </Grid>
                    <Grid item xs={6}>
                        <Entry name={"Sequencing ID"} value={dataset.sequencingID} />
                        <Entry name={"Sequencing Centre"} value={dataset.sequencingCentre} />
                        <Entry name={"Creation Time"} value={dataset.created} />
                        <Entry name={"Created By"} value={dataset.createdBy.toString()} />
                        <Entry name={"Update Time"} value={dataset.updated} />
                        <Entry name={"Updated By"} value={dataset.updatedBy.toString()} />
                        <Entry name={"Discriminator"} value={dataset.discriminator} />
                    </Grid>
                </Grid>
            </AccordionDetails>
        </Accordion>
    );
}

interface DatasetAccordionProp {
    datasets: Dataset[],
}

export default function DatasetAccordions({ datasets }: DatasetAccordionProp) {
    const classes = useStyles();
    
    return (
        <div className={classes.root}>
            {
                datasets.length === 0 ? (<Typography variant="body2" align="center">No records to display</Typography>) :
                                        (datasets.map(dataset => <DatasetAccordion dataset={dataset} />))
            }
        </div>
    );
}