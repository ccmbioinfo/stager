import React from 'react';
import { makeStyles, Accordion, AccordionSummary, AccordionDetails, Typography } from '@material-ui/core';
import { ExpandMore } from '@material-ui/icons';
import MaterialTable from 'material-table';
import { Participant, getSamplesAndDatasets, Sample, Dataset, Analysis } from './MockData';

const useStyles = makeStyles(theme => ({
    content: {
        flexGrow: 1,
        height: '100vh',
        overflow: 'auto',
    },
    root: {
        marginLeft: '5%',
        marginRight: '5%',
        marginTop: theme.spacing(1),
        marginBottom: theme.spacing(1),
    },
}));

interface ParticipantInfoProp {
    participantID: string
}

export default function ParticipantInfoTable({ participantID }: ParticipantInfoProp) {
    const classes = useStyles();
    
    //fetch participant samples and datasets for each sample
    const info = getSamplesAndDatasets(participantID);

    return (
        <div>
            <MaterialTable
                // remove paper effect
                // components={{
                //     Container: (props: any) => <Paper {...props} elevation={0}/>
                // }}
                columns={[
                    { title: 'Sample ID', field: 'sampleID' },
                    { title: 'Extraction Date', field: 'extractionDate' },
                    { title: 'Sample Type', field: 'sampleType' },
                    { title: 'Tissue Processing', field: 'tissueProcessing' },
                    { title: 'Notes', field: 'notes' },
                    { title: 'Creation Time', field: 'created' },
                    { title: 'Create By', field: 'createBy' },
                    { title: 'Last Update Time', field: 'updated' },
                    { title: 'Updated By', field: 'updatedBy' },
                ]}
                data={info.samples}
                title="Samples"
                detailPanel={rowData => {
                    console.log("sjdfksd")
                    return (
                        <DatasetsAccordion datasets={info.datasets.filter(dataset => dataset.sampleID === rowData.sampleID)} />
                        // <DatasetsTable datasets={info.datasets.filter(dataset => dataset.sampleID === rowData.sampleID)} />
                    )
                  }}
                options={{
                    paging: false,
                    selection: false,
                    search: false,
                }}
            />            
        </div>
    )
}

interface DatasetsTableProp {
    datasets: Dataset[],
}
function DatasetsTable({ datasets}: DatasetsTableProp) {
    const classes = useStyles();
    
    if(datasets.length === 0){
        return (
            <div className={classes.root}>
               <Typography variant="body2" align="center">No Record To Display</Typography>
            </div>
        )
    }else{
        return (
            <div  style={{ padding: '10px 0px 10px 50px' }}>
                <MaterialTable
                    columns={[
                        { title: 'Dataset ID', field: 'datasetID' },
                        { title: 'Sample ID', field: 'sampleID' },
                        { title: 'Dataset Type', field: 'datasetType' },
                        { title: 'Input HPF Path', field: 'inputHpfPath' },
                        { title: 'Notes', field: 'notes' },
                        { title: 'Condition', field: 'condition' },
                        { title: 'Extraction Protocol', field: 'extractionProtocol' },
                        { title: 'Capture Kit', field: 'captureKit' },
                        { title: 'Library Prep Method', field: 'libraryPrepMethod' },
                        { title: 'Library Prep Date', field: 'libraryPrepDate' },
                        { title: 'Read Length', field: 'readLength' },
                        { title: 'Read Type', field: 'readType' },
                        { title: 'Sequencing ID', field: 'sequencingID' },
                        { title: 'Sequencing Centre', field: 'sequencingCentre' },
                        { title: 'Batch ID', field: 'batchID' },
                        { title: 'Creation Time', field: 'created' },
                        { title: 'Created By', field: 'createdBy' },
                        { title: 'Update Time', field: 'updated' },
                        { title: 'Updated By', field: 'updatedBy' },
                        { title: 'Discriminator', field: 'discriminator' },
                    ]}
                    data={datasets}
                    title="Datasets"
                    options={{
                        paging: false,
                        selection: false,
                        search: false,
                        padding: 'dense',
                    }}
                    
                />
            </div>
        )
    }
}

function DatasetsAccordion({ datasets }: DatasetsTableProp) {
    const classes = useStyles();
    
    //get participant samples
    // const info = getParticipantInfo(participantID);
    // const rows: Sample[] = samples.filter(sample => sample.sampleID === sampleID)
    if(datasets.length === 0){
        return (
            <div className={classes.root}>
               <Typography variant="body2" align="center">No Record To Display</Typography>
            </div>
        )
    }else{
        return (
            <div className={classes.root}>
                {datasets.map(dataset => getAccordion(dataset))}
            </div>
        )
    }
}

const getAccordion = (dataset: Dataset) => {
    return (
        <Accordion >
            <AccordionSummary expandIcon={<ExpandMore />} aria-controls="panel1a-content" id="panel1a-header">
                <Typography variant="body2">Dataset: {dataset.datasetID}</Typography>
            </AccordionSummary>
            <AccordionDetails>
                <div>
                {/* <Grid container spacing={2} justify="space-evenly">
                    <Grid item xs={6}>
                        <Typography variant="body2">Dataset Type: {dataset.datasetType}</Typography>
                        <Typography variant="body2">Input HPF Path: {dataset.inputHpfPath}</Typography>
                        <Typography variant="body2">Condition: {dataset.notes}</Typography>
                        <Typography variant="body2">Extraction Protocol: {dataset.extractionProtocol}</Typography>
                        <Typography variant="body2">Capture Kit: {dataset.captureKit}</Typography>
                        <Typography variant="body2">Library Prep Method: {dataset.libraryPrepMethod}</Typography>
                        <Typography variant="body2">Library Prep Date: {dataset.libraryPrepDate}</Typography>
                        <Typography variant="body2">Read Length: {dataset.readLength}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                        <Typography variant="body2">Read Type: {dataset.readType}</Typography>
                        <Typography variant="body2">Sequencing ID: {dataset.sequencingID}</Typography>
                        <Typography variant="body2">Sequencing Centre: {dataset.sequencingCentre}</Typography>
                        <Typography variant="body2">Created By: {dataset.createdBy}</Typography>
                        <Typography variant="body2">Creation Time: {dataset.created}</Typography>
                        <Typography variant="body2">Update Time: {dataset.updated}</Typography>
                        <Typography variant="body2">Updated By: {dataset.updatedBy}</Typography>
                        <Typography variant="body2">Discriminator: {dataset.discriminator}</Typography>
                    </Grid>
                </Grid> */}
                    <Typography variant="body2">Dataset Type: {dataset.datasetType}</Typography>
                    <Typography variant="body2">Input HPF Path: {dataset.inputHpfPath}</Typography>
                    <Typography variant="body2">Condition: {dataset.notes}</Typography>
                    <Typography variant="body2">Extraction Protocol: {dataset.extractionProtocol}</Typography>
                    <Typography variant="body2">Capture Kit: {dataset.captureKit}</Typography>
                    <Typography variant="body2">Library Prep Method: {dataset.libraryPrepMethod}</Typography>
                    <Typography variant="body2">Library Prep Date: {dataset.libraryPrepDate}</Typography>
                    <Typography variant="body2">Read Length: {dataset.readLength}</Typography>
                    <Typography variant="body2">Read Type: {dataset.readType}</Typography>
                    <Typography variant="body2">Sequencing ID: {dataset.sequencingID}</Typography>
                    <Typography variant="body2">Sequencing Centre: {dataset.sequencingCentre}</Typography>
                    <Typography variant="body2">Created By: {dataset.createdBy}</Typography>
                    <Typography variant="body2">Creation Time: {dataset.created}</Typography>
                    <Typography variant="body2">Update Time: {dataset.updated}</Typography>
                    <Typography variant="body2">Updated By: {dataset.updatedBy}</Typography>
                    <Typography variant="body2">Discriminator: {dataset.discriminator}</Typography>
                </div>
                
            </AccordionDetails>
        </Accordion>
    )
}