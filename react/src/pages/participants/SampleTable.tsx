import React from "react";
import { makeStyles } from "@material-ui/core";
import { Dns } from "@material-ui/icons";
import MaterialTable, { MTableCell } from "material-table";
import { formatDateString, createFieldObj } from "../utils/functions";
import { Dataset, Sample, Info } from "../utils/typings";
import InfoList from "../utils/components/InfoList";

const useStyles = makeStyles(theme => ({
    datasetList: {
        marginLeft: theme.spacing(3),
        marginRight: theme.spacing(3),
    },
    cell: {
        padding: 0,
    },
}));

function getFields(dataset: Dataset) {
    return [
        createFieldObj("Input HPF Path", dataset.input_hpf_path),
        createFieldObj("Condition", dataset.condition),
        createFieldObj("Extraction Protocol", dataset.extraction_protocol),
        createFieldObj("Capture Kit", dataset.capture_kit),
        createFieldObj("Library Prep Method", dataset.library_prep_method),
        createFieldObj("Library Prep Date", formatDateString(dataset.library_prep_date)),
        createFieldObj("Read Length", dataset.read_length),
        createFieldObj("Read Type", dataset.read_type),
        createFieldObj("Sequencing ID", dataset.sequencing_id),
        createFieldObj("Sequencing Centre", dataset.sequencing_centre),
        createFieldObj("Creation Time", formatDateString(dataset.created)),
        createFieldObj("Created By", dataset.created_by),
        createFieldObj("Last Updated", formatDateString(dataset.updated)),
        createFieldObj("Updated By", dataset.updated_by),
        createFieldObj("Discriminator", dataset.discriminator),
    ];
}

export default function SampleTable({ samples }: { samples: Sample[] }) {
    const classes = useStyles();

    return (
        <MaterialTable
            columns={[
                { title: "Sample ID", field: "tissue_sample_id" },
                {
                    title: "Extraction Date",
                    field: "extraction_date",
                    render: rowData => formatDateString(rowData.extraction_date),
                },
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
            title="Tissue Samples"
            detailPanel={rowData => {
                const infoList: Info[] = rowData.datasets.map(dataset => {
                    return {
                        primaryListTitle: `Dataset ID ${dataset.dataset_id}`,
                        fields: getFields(dataset),
                    };
                });
                return (
                    <div className={classes.datasetList}>
                        <InfoList infoList={infoList} icon={<Dns />} linkPath="/datasets" />
                    </div>
                );
            }}
            components={{
                Container: props => <div>{props.children}</div>,
                Cell: props => <MTableCell {...props} className={classes.cell} />,
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
