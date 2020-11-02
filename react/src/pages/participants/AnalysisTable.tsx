import React from "react";
import MaterialTable from "material-table";
import { Analysis, formatDateString } from "../utils";

interface ParticipantInfoProp {
    participantID: string;
}

export default function AnalysisTable({ participantID }: ParticipantInfoProp) {
    //fetch participant analyses
    const analyses = [] as Analysis[];

    return (
        <MaterialTable
            columns={[
                { title: "Analysis ID", field: "analysis_id" },
                { title: "Dataset ID", field: "dataset_id" },
                { title: "Analysis State", field: "analysis_state" },
                { title: "Pipeline ID", field: "pipeline_id" },
                { title: "Qsub ID", field: "qsubID" },
                { title: "Result HPF Path", field: "result_hpf_path" },
                { title: "Assignee", field: "assignee" },
                { title: "Requester", field: "requester" },
                {
                    title: "Requested",
                    field: "requested",
                    render: rowData => formatDateString(rowData.requested),
                },
                {
                    title: "Started",
                    field: "started",
                    render: rowData => formatDateString(rowData.started),
                },
                {
                    title: "Finished",
                    field: "finished",
                    render: rowData => formatDateString(rowData.finished),
                },
                { title: "Notes", field: "notes" },
                {
                    title: "Updated",
                    field: "updated",
                    render: rowData => formatDateString(rowData.updated),
                },
                { title: "Updated By", field: "updated_by" },
            ]}
            data={analyses}
            title="Analyses"
            options={{
                paging: false,
                selection: false,
                search: false,
                padding: "dense",
            }}
        />
    );
}
