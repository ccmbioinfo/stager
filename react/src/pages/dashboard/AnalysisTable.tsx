import React from 'react';
import { makeStyles, Accordion, AccordionSummary, AccordionDetails, Typography } from '@material-ui/core';
import { ExpandMore } from '@material-ui/icons';
import MaterialTable from 'material-table';
import { Participant, getAnalyses, Sample, Dataset, Analysis } from './MockData';

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
    accrodion: {

    }
}));

interface ParticipantInfoProp {
    participantID: string
}

export default function AnalysisTable({ participantID }: ParticipantInfoProp) {
    const classes = useStyles();

    //get participant samples
    const analyses = getAnalyses(participantID);

    return (
        <MaterialTable
            columns={[
                { title: 'Analysis ID', field: 'analysisID' },
                { title: 'Dataset ID', field: 'datasetID' },
                { title: 'Analysis State', field: 'analysisState' },
                { title: 'Pipeline ID', field: 'pipelineID' },
                { title: 'Qsub ID', field: 'qsubID' },
                { title: 'Result HPF Path', field: 'resultHpfPath' },
                { title: 'Assignee', field: 'assignee' },
                { title: 'Requester', field: 'requester' },
                { title: 'Requested', field: 'requested' },
                { title: 'Started', field: 'started' },
                { title: 'Finished', field: 'finished' },
                { title: 'Notes', field: 'notes' },
                { title: 'Updated', field: 'updated' },
                { title: 'Updated By', field: 'updatedBy' },
            ]}
            data={analyses}
            title="Analyses"
            options={{
                paging: false,
                selection: false,
                search: false,
            }}
        />
    )
}