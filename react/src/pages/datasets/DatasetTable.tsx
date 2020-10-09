import React, { useEffect, useState } from 'react';
import { makeStyles, Chip, IconButton } from '@material-ui/core';
import { PlayArrow, Delete, Cancel } from '@material-ui/icons';
import MaterialTable, { MTableToolbar } from 'material-table';
import { toKeyValue, KeyValue } from "../utils";
import AnalysisRunnerDialog, { Pipeline } from './AnalysisRunnerDialog';

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

export default function DatasetTable() {
    const classes = useStyles();
    const [showRunner, setRunner] = useState(false);
    const [selectedDatasets, setSelectedDatasets] = useState<Dataset[]>([]);
    const [datasetTypeFilter, setDatasetTypeFilter] = useState<string[]>([]);

    const [datasets, setDatasets] = useState<Dataset[]>([]);
    const [pipelines, setPipelines] = useState<Pipeline[]>([]);
    const [tissueSampleTypes, setTissueSampleTypes] = useState<KeyValue>({});
    const [datasetTypes, setDatasetTypes] = useState<KeyValue>({});
    const [conditions, setConditions] = useState<KeyValue>({});

    useEffect(() => {
        fetch("/api/enums").then(async response => {
            if (response.ok) {
                const enums = await response.json();
                setTissueSampleTypes(toKeyValue(enums.TissueSampleType));
                setDatasetTypes(toKeyValue(enums.DatasetType));
                setConditions(toKeyValue(enums.DatasetCondition));
            } else {
                console.error(`GET /api/enums failed with ${response.status}: ${response.statusText}`);
            }
        });
        fetch("/api/datasets").then(async response => {
            if (response.ok) {
                setDatasets(await response.json());
            } else {
                console.error(`GET /api/datasets failed with ${response.status}: ${response.statusText}`);
            }
        });
        fetch("/api/pipelines").then(async response => {
            if (response.ok) {
                setPipelines(await response.json());
            } else {
                console.error(`GET /api/pipelines failed with ${response.status}: ${response.statusText}`);
            }
        })
    }, []);

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
                    { title: 'Dataset Type', field: 'dataset_type', defaultFilter: datasetTypeFilter, lookup: datasetTypes },
                    { title: 'Condition', field: 'condition', lookup: conditions },
                    { title: 'Notes', field: 'notes' },
                    // { title: 'Created', field: 'created', type: 'datetime' },
                    // { title: 'Created by', field: 'created_by' },
                    { title: 'Updated', field: 'updated', type: 'datetime' },
                    { title: 'Updated By', field: 'updated_by' },
                ]}
                data={datasets}
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
                                {[...new Set(datasets.map(e => e.dataset_type))].map(type => (
                                    <Chip label={type} onClick={() => setDatasetTypeFilter([type])} clickable className={classes.chip} />
                                ))}
                                <IconButton onClick={() => setDatasetTypeFilter([])} className={classes.chip}>
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
