import React from "react";
import { makeStyles } from "@material-ui/core";
import { Dns } from "@material-ui/icons";
import MaterialTable, { MTableCell } from "material-table";
import { formatDateString, getDatasetInfoList } from "../utils/functions";
import { Sample, Info } from "../utils/typings";
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
            title="Samples"
            detailPanel={rowData => {
                const infoList: Info[] = getDatasetInfoList(rowData.datasets).map(info => {
                    return { ...info, secondaryListTitle: "" };
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
