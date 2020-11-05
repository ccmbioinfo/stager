import React from "react";
import { makeStyles } from "@material-ui/core";
import MaterialTable from "material-table";
import { formatDateString } from "../utils/functions";
import { Sample } from "../utils/typings";
import DatasetList from "./DatasetList";
const useStyles = makeStyles(theme => ({
    paper: {
        // border: "solid red 1px"
    },
}));

interface SamplesTableProp {
    samples: Sample[];
}

export default function SamplesTable({ samples }: SamplesTableProp) {
    const classes = useStyles();
    const cellStyle = {
        padding: 0,
    };
    return (
        <MaterialTable
            columns={[
                { title: "Sample ID", field: "tissue_sample_id", cellStyle: cellStyle },
                {
                    title: "Extraction Date",
                    field: "extraction_date",
                    cellStyle: cellStyle,
                    render: rowData => formatDateString(rowData.updated),
                },
                { title: "Sample Type", field: "tissue_sample_type", cellStyle: cellStyle },
                { title: "Tissue Processing", field: "tissue_processing", cellStyle: cellStyle },
                { title: "Notes", field: "notes", cellStyle: cellStyle },
                {
                    title: "Creation Time",
                    field: "created",
                    cellStyle: cellStyle,
                    render: rowData => formatDateString(rowData.created),
                },
                { title: "Create By", field: "created_by", cellStyle: cellStyle },
                {
                    title: "Update Time",
                    field: "updated",
                    cellStyle: cellStyle,
                    render: rowData => formatDateString(rowData.updated),
                },
                { title: "Updated By", field: "updated_by", cellStyle: cellStyle },
            ]}
            data={samples}
            title="Samples"
            detailPanel={rowData => <DatasetList datasets={rowData.datasets} />}
            components={{
                Container: props => <div className={classes.paper}>{props.children}</div>,
            }}
            options={{
                paging: false,
                selection: false,
                search: false,
                headerStyle: {
                    padding: 0,
                },
            }}
        />
    );
}
