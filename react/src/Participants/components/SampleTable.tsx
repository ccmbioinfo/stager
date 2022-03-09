import MaterialTable, { MTableCell } from "@material-table/core";
import { makeStyles } from "@material-ui/core";
import { Dns } from "@material-ui/icons";
import { DateTimeText, InfoList } from "../../components";
import { Dataset, Field, Info, Sample } from "../../typings";

const useStyles = makeStyles(theme => ({
    datasetList: {
        marginLeft: theme.spacing(3),
        marginRight: theme.spacing(3),
    },
    cell: {
        padding: 0,
    },
}));

function getFields(dataset: Dataset): Field[] {
    return [
        {
            title: "Linked Files",
            fieldName: "linked_files",
            editable: true,
            type: "linked_files",
            value: dataset.linked_files,
        },
        { title: "Condition", fieldName: "condition", editable: true, value: dataset.condition },
        {
            title: "Extraction Protocol",
            fieldName: "extraction_protocol",
            editable: true,
            value: dataset.extraction_protocol,
        },
        {
            title: "Capture Kit",
            fieldName: "capture_kit",
            editable: true,
            value: dataset.capture_kit,
        },
        {
            title: "Library Prep Method",
            fieldName: "library_prep_method",
            editable: true,
            value: dataset.library_prep_method,
        },
        {
            title: "Library Prep Date",
            fieldName: "library_prep_date",
            editable: true,
            type: "date",
            value: dataset.library_prep_date,
        },
        {
            title: "Read Length",
            fieldName: "read_length",
            editable: true,
            value: dataset.read_length,
        },
        { title: "Read Type", fieldName: "read_type", editable: true, value: dataset.read_type },
        {
            title: "Sequencing ID",
            fieldName: "sequencing_id",
            editable: true,
            value: dataset.sequencing_id,
        },
        {
            title: "Sequencing Centre",
            fieldName: "sequencing_centre",
            editable: true,
            value: dataset.sequencing_centre,
        },
        {
            title: "Creation Time",
            type: "timestamp",
            fieldName: "created",
            editable: false,
            value: dataset.created,
        },
        {
            title: "Created By",
            fieldName: "created_by",
            editable: false,
            value: dataset.created_by,
        },
        {
            title: "Last Updated",
            type: "timestamp",
            fieldName: "updated",
            editable: false,
            value: dataset.updated,
        },
        {
            title: "Updated By",
            fieldName: "updated_by",
            editable: false,
            value: dataset.updated_by,
        },
    ];
}

export default function SampleTable(props: {
    samples: Sample[];
}) {
    const classes = useStyles();

    return (
        <MaterialTable
            columns={[
                {
                    title: "Extraction Date",
                    field: "extraction_date",
                    render: rowData => <DateTimeText datetime={rowData.extraction_date} />,
                },
                { title: "Sample Type", field: "tissue_sample_type" },
                { title: "Tissue Processing", field: "tissue_processing" },
                { title: "Notes", field: "notes" },
                {
                    title: "Creation Time",
                    field: "created",
                    render: rowData => <DateTimeText datetime={rowData.created} />,
                },
                { title: "Created By", field: "created_by" },
                {
                    title: "Update Time",
                    field: "updated",
                    render: rowData => <DateTimeText datetime={rowData.updated} />,
                },
                { title: "Updated By", field: "updated_by" },
            ]}
            data={props.samples}
            title="Tissue Samples"
            detailPanel={({ rowData }) => {
                const infoList: Info[] = rowData.datasets.map(dataset => {
                    return {
                        fields: getFields(dataset),
                        identifier: dataset.dataset_id,
                        linkPath: "datasets",
                        primaryListTitle: `Dataset ID ${dataset.dataset_id}`,
                    };
                });
                return (
                    <div className={classes.datasetList}>
                        <InfoList
                            infoList={infoList}
                            icon={<Dns />}
                            linkPath="/datasets"
                        />
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
