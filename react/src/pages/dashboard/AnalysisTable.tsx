import React from 'react';
import MaterialTable from 'material-table';
import { Analysis } from './MockData';

interface ParticipantInfoProp {
    participantID: string
}

export default function AnalysisTable({ participantID }: ParticipantInfoProp) {

    //fetch participant analyses
    const analyses = [] as Analysis[];

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
    );
}