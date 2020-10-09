import React, { useState } from 'react';
import { makeStyles, Chip, IconButton } from '@material-ui/core';
import { PlayArrow, Delete, Cancel } from '@material-ui/icons';
import MaterialTable, { MTableToolbar } from 'material-table';
import { toKeyValue } from "../utils";
import AnalysisRunnerDialog from './AnalysisRunnerDialog';

export interface Dataset {
    dataset_id: number;
    tissue_sample_type: string;
    participant_codename: string;
    family_codename: string;
    dataset_type: string;
    input_hpf_path?: string;
    notes?: string;
    condition: string;
    created: Date;
    created_by: string;
    updated: Date;
    updated_by: string;
}

const useStyles = makeStyles(theme => ({
    chip: {
        color: "primary",
        marginRight: '10px',
        colorPrimary: theme.palette.primary,
    },
    chipBar: {
        marginLeft: '24px',
        marginTop: '6px'
    }
}));

function createDataset(
    dataset_id: number,
    tissue_sample_type: string,
    participant_codename: string,
    family_codename: string,
    dataset_type: string,
    condition: string,
    created: Date,
    created_by: string,
    updated: Date,
    updated_by: string) {
    return {
        dataset_id, tissue_sample_type, participant_codename, family_codename,
        dataset_type, condition, created, created_by, updated, updated_by
    };
}

const rows: Dataset[] = [
    createDataset(1, 'Blood', 'AA0001', '3001', 'WGS', 'Somatic', new Date(), 'CHEO', new Date(), 'CHEO'),
    createDataset(2, 'Blood', 'AA0002', '3002', 'WGS', 'Somatic', new Date('2020-09-01'), 'CHEO', new Date('2020-09-01'), 'CHEO'),
    createDataset(3, 'Blood', 'AA0003', '3003', 'WGS', 'Somatic', new Date('2020-09-01'), 'CHEO', new Date('2020-09-01'), 'CHEO'),
    createDataset(4, 'Skin', 'BB0001', '2001', 'WES', 'Somatic', new Date('2020-09-01'), 'CHEO', new Date('2020-09-01'), 'CHEO'),
    createDataset(5, 'Blood', 'BB0002', '2002', 'WGS', 'Somatic', new Date('2020-09-01'), 'CHEO', new Date('2020-09-01'), 'CHEO'),
    createDataset(6, 'Saliva', 'BB0003', '2003', 'WES', 'Somatic', new Date('2020-08-22'), 'ACH', new Date(), 'ACH'),
    createDataset(7, 'Blood', 'AA0004', '3012', 'WGS', 'Somatic', new Date('2020-08-22'), 'ACH', new Date(), 'ACH'),
    createDataset(8, 'Skin', 'AA0005', '3013', 'WES', 'Somatic', new Date('2020-08-22'), 'ACH', new Date(), 'ACH'),
];

const pipelines = [
    { name: "CRG", version: "1.1" },
    { name: "CRG", version: "2.0" },
    { name: "CRE", version: "1.5" },
];

export default function DatasetTable() {
    const classes = useStyles();
    const [showRunner, setRunner] = useState(false);
    const [selectedDatasets, setSelectedDatasets] = useState<Dataset[]>([]);
    const [datasetType, setDatasetType] = useState<string[]>([]);

    // TODO: replace with enum values from backend
    const tissueSampleTypes = toKeyValue(["Blood", "Saliva", "Skin"]);
    const datasetTypes = toKeyValue(["WGS", "WES"]);
    const conditions = toKeyValue(["Control", "GermLine", "Somatic"]);

    return (
        <div>
            <AnalysisRunnerDialog
                datasets={selectedDatasets}
                pipelines={pipelines}
                open={showRunner}
                onClose={() => setRunner(false)}
            />
            <MaterialTable
                columns={[
                    { title: 'Participant', field: 'participant_codename', editable: 'never' },
                    { title: 'Family', field: 'family_codename', editable: 'never' },
                    { title: 'Tissue Sample', field: 'tissue_sample_type', lookup: tissueSampleTypes },
                    { title: 'Dataset Type', field: 'dataset_type', defaultFilter: datasetType, lookup: datasetTypes },
                    { title: 'Condition', field: 'condition', lookup: conditions },
                    { title: 'Notes', field: 'notes' },
                    // { title: 'Created', field: 'created', type: 'datetime' },
                    // { title: 'Created by', field: 'created_by' },
                    { title: 'Updated', field: 'updated', type: 'datetime' },
                    { title: 'Updated By', field: 'updated_by' },
                ]}
                data={rows}
                title="Datasets"
                options={{
                    pageSize: 10,
                    selection: true,
                    filtering: true,
                    search: false
                }}
                editable={{
                    onRowUpdate: (newData, oldData) =>
                        new Promise((resolve, reject) => {
                            setTimeout(() => {
                                // const dataUpdate = [...data];
                                // const index = oldData.tableData.id;
                                // dataUpdate[index] = newData;
                                // setData([...dataUpdate]);

                                resolve();
                            }, 1000);
                        }),
                }}
                components={{
                    Toolbar: props => (
                        <div>
                            <MTableToolbar {...props} />
                            <div className={classes.chipBar}>
                                {[...new Set(rows.map(e => e.dataset_type))].map(type => (
                                    <Chip label={type} onClick={() => setDatasetType([type])} clickable className={classes.chip} />
                                ))}
                                <IconButton onClick={() => setDatasetType([])} className={classes.chip}>
                                    <Cancel />
                                </IconButton>
                            </div>
                        </div>
                    ),
                }}
                actions={[
                    {
                        tooltip: 'Delete selected datasets',
                        icon: Delete,
                        onClick: (evt, data) => {
                            const sampleString = (data as Dataset[])
                                .map(dataset => `${dataset.participant_codename}/${dataset.tissue_sample_type}/${dataset.dataset_type}`)
                                .join(', ');
                            alert(`Withdraw all datasets and records associated with: ${sampleString}`)
                        }
                    },
                    {
                        tooltip: 'Analyze selected datasets',
                        icon: PlayArrow,
                        onClick: (evt, data) => {
                            setSelectedDatasets(data as Dataset[])
                            setRunner(true)
                        }
                    }
                ]}
            />
        </div>
    )
}
