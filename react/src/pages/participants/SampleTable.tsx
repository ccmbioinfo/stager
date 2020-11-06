import React from "react";
import { makeStyles } from "@material-ui/core";
import { Dns } from "@material-ui/icons";
import MaterialTable from "material-table";
import { formatDateString } from "../utils/functions";
import { Dataset, Sample, Info } from "../utils/typings";
import InfoList from "../utils/components/InfoList";

const useStyles = makeStyles(theme => ({
    datasetList: {
        marginLeft: theme.spacing(3),
        marginRight: theme.spacing(3),
    },
}));

function getTitles() {
    return [
        "Input HPF Path",
        "Condition",
        "Extraction Protocol",
        "Capture Kit",
        "Library Prep Method",
        "Library Prep Date",
        "Read Length",
        "Read Type",
        "Sequencing ID",
        "Sequencing Centre",
        "Creation Time",
        "Created By",
        "Last Updated",
        "Updated By",
        "Discriminator",
    ];
}
function getValues(dataset: Dataset) {
    return [
        dataset.input_hpf_path,
        dataset.condition,
        dataset.extraction_protocol,
        dataset.capture_kit,
        dataset.library_prep_method,
        formatDateString(dataset.library_prep_date),
        dataset.read_length,
        dataset.read_type,
        dataset.sequencing_id,
        dataset.sequencing_centre,
        formatDateString(dataset.created),
        dataset.created_by,
        formatDateString(dataset.updated),
        dataset.updated_by,
        dataset.discriminator,
    ];
}

export default function SamplesTable({ samples }: { samples: Sample[] }) {
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
            detailPanel={rowData => {
                const infoList: Info[] = rowData.datasets.map(dataset => {
                    return {
                        primaryListTitle: `Dataset ID ${dataset.dataset_id}`,
                        titles: getTitles(),
                        values: getValues(dataset),
                    } as Info;
                });
                return (
                    <div className={classes.datasetList}>
                        <InfoList infoList={infoList} icon={<Dns />} />
                    </div>
                );
            }}
            components={{
                Container: props => <div>{props.children}</div>,
                Cell: props => <MTableCell {...props} style={cellStyle} />
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
