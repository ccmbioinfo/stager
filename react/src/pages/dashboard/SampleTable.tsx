import React from 'react';
import { makeStyles } from '@material-ui/core';
import MaterialTable from 'material-table';
import { getSamplesAndDatasets } from './MockData';
import DatasetAccordion from './DatasetAccordion'

const useStyles = makeStyles(theme => ({
    table: {
        marginBottom: theme.spacing(3)
    }
}));

interface ParticipantInfoProp {
    participantID: string
}

export default function SamplesTable({ participantID }: ParticipantInfoProp) {
    const classes = useStyles();
    
    //fetch participant samples and datasets for each sample
    const info = getSamplesAndDatasets(participantID);

    return (
        <div className={classes.table}>
            <MaterialTable
                columns={[
                    { title: 'Sample ID', field: 'sampleID' },
                    { title: 'Extraction Date', field: 'extractionDate' },
                    { title: 'Sample Type', field: 'sampleType' },
                    { title: 'Tissue Processing', field: 'tissueProcessing' },
                    { title: 'Notes', field: 'notes' },
                    { title: 'Creation Time', field: 'created' },
                    { title: 'Create By', field: 'createBy' },
                    { title: 'Update Time', field: 'updated' },
                    { title: 'Updated By', field: 'updatedBy' },
                ]}
                data={info.samples}
                title="Samples"
                detailPanel={rowData => <DatasetAccordion datasets={info.datasets.filter(dataset => dataset.sampleID === rowData.sampleID)} />}
                options={{
                    paging: false,
                    selection: false,
                    search: false,
                }}
            />            
        </div>
    );
}