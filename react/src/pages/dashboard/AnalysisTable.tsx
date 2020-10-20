import React from 'react';
import MaterialTable from 'material-table';
import { getAnalyses } from './MockData';
import { formatDateString } from '../utils';

interface ParticipantInfoProp {
    participantID: string
}

export default function AnalysisTable({ participantID }: ParticipantInfoProp) {

    //fetch participant analyses
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
                { title: 'Requested', field: 'requested', render: rowData => formatDateString(rowData.requested) },
                { title: 'Started', field: 'started', render: rowData => formatDateString(rowData.started) },
                { title: 'Finished', field: 'finished', render: rowData => formatDateString(rowData.finished) },
                { title: 'Notes', field: 'notes' },
                { title: 'Updated', field: 'updated', render: rowData => formatDateString(rowData.updated) },
                { title: 'Updated By', field: 'updatedBy' },
            ]}
            data={analyses}
            title="Analyses"
            options={{
                paging: false,
                selection: false,
                search: false,
                padding: "dense"
            }}
        />
    );
}
