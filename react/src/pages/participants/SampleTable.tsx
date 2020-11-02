import React from "react";
import { makeStyles } from "@material-ui/core";
import MaterialTable from "material-table";
import { formatDateString, Sample } from "../utils";
import DatasetAccordions from "./DatasetAccordion";

const useStyles = makeStyles(theme => ({
    table: {
        marginBottom: theme.spacing(3),
    },
}));

interface SamplesTableProp {
    samples: Sample[];
}

export default function SamplesTable({ samples }: SamplesTableProp) {
    const classes = useStyles();

    return (
        <div className={classes.table}>
            <MaterialTable
                columns={[
                    { title: "Sample ID", field: "tissue_sample_id" },
                    { title: "Extraction Date", field: "extraction_date" },
                    { title: "Sample Type", field: "tissue_sample_type" },
                    { title: "Tissue Processing", field: "tissue_processing" },
                    { title: "Notes", field: "notes" },
                    {
                        title: "Creation Time",
                        field: "created",
                        render: rowData => formatDateString(rowData.created),
                    },
                    { title: "Create By", field: "created_by" },
                    {
                        title: "Update Time",
                        field: "updated",
                        render: rowData => formatDateString(rowData.updated),
                    },
                    { title: "Updated By", field: "updated_by" },
                ]}
                data={samples}
                title="Samples"
                detailPanel={rowData => <DatasetAccordions datasets={rowData.datasets} />}
                options={{
                    paging: false,
                    selection: false,
                    search: false,
                    padding: "dense",
                }}
            />
        </div>
    );
}
