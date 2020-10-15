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

function Entry({ name, value }: { name: string, value: string | number }) {
    return (<Typography variant="body2">{name}: {value}</Typography>);
}

function DatasetAccordion({ dataset }: { dataset: Dataset }) {
    return (
        <Accordion >
            <AccordionSummary expandIcon={<ExpandMore />} aria-controls="panel1a-content" id="panel1a-header">
                <Typography variant="body2">Dataset {dataset.dataset_id} [{dataset.dataset_type}]</Typography>
            </AccordionSummary>
            <AccordionDetails>
                <Grid container spacing={2} justify="space-evenly">
                    <Grid item xs={6}>
                        <Entry name={"Input HPF Path"} value={dataset.input_hpf_path} />
                        <Entry name={"Condition"} value={dataset.condition} />
                        <Entry name={"Extraction Protocol"} value={dataset.extraction_protocol} />
                        <Entry name={"Capture Kit"} value={dataset.capture_kit} />
                        <Entry name={"Library Prep Method"} value={dataset.library_prep_method} />
                        <Entry name={"Library Prep Date"} value={dataset.library_prep_date} />
                        <Entry name={"Read Length"} value={dataset.read_length} />
                        <Entry name={"Read Type"} value={dataset.read_type} />
                    </Grid>
                    <Grid item xs={6}>
                        <Entry name={"Sequencing ID"} value={dataset.sequencing_id} />
                        <Entry name={"Sequencing Centre"} value={dataset.sequencing_centre} />
                        <Entry name={"Creation Time"} value={dataset.created} />
                        <Entry name={"Created By"} value={dataset.created_by} />
                        <Entry name={"Update Time"} value={dataset.updated} />
                        <Entry name={"Updated By"} value={dataset.updated_by} />
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
                datasets.length === 0
                ? (<Typography variant="body2" align="center">No records to display</Typography>)
                : (datasets.map(dataset => <DatasetAccordion dataset={dataset} />))
            }
        </div>
    );
}