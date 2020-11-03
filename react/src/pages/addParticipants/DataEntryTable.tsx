import React, { useState, useEffect } from 'react';
import { makeStyles, Chip, IconButton } from '@material-ui/core';
import { Cancel, FileCopy, Link } from '@material-ui/icons';
import MaterialTable, { MTableToolbar } from 'material-table';
import { useSnackbar } from 'notistack';
import { countArray, toKeyValue, KeyValue, Participant, Sample, Dataset } from '../utils';

const useStyles = makeStyles(theme => ({
    chip: {
        color: "primary",
        marginRight: '10px',
        colorPrimary: theme.palette.primary,
    },
    leftMostIcon: {
        marginLeft: theme.spacing(1),
    },
}));

export default function DataEntryTable() {
    const classes = useStyles();
    const [filter, setFilter] = useState<string[]>([]);
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [detail, setDetail] = useState(false);
    const [activeRow, setActiveRow] = useState<Participant | undefined>(undefined);
    const [sexTypes, setSexTypes] = useState<KeyValue>({});
    const [datasetTypes, setDatasetTypes] = useState<KeyValue>({});
    const [participantTypes, setParticipantTypes] = useState<KeyValue>({});
    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    async function linkDataset(event: React.MouseEvent, rowData: Participant | Participant[]) {
       
    }

    useEffect(() => {
        fetch("/api/enums").then(async response => {
            if (response.ok) {
                const enums = await response.json();
                setSexTypes(toKeyValue(enums.Sex));
                setDatasetTypes(toKeyValue(enums.DatasetType));
                setParticipantTypes(toKeyValue(enums.ParticipantType));
            } else {
                console.error(`GET /api/enums failed with ${response.status}: ${response.statusText}`);
            }
        });

        fetch("/api/participants").then(async response => {
            if (response.ok) {
                const participants = await response.json();
                participants.forEach((participant: Participant) => {
                    const samples = participant.tissue_samples;
                    samples.forEach((sample: Sample) => {
                        const datasets = sample.datasets;
                        datasets.forEach((dataset: Dataset) => {
                            participant['dataset_types'] ?
                            participant['dataset_types'].push(dataset.dataset_type) :
                            participant['dataset_types'] = [dataset.dataset_type];
                        })
                    })
                })
                setParticipants(participants as Participant[]);
            } else {
                console.error(`GET /api/participants failed with ${response.status}: ${response.statusText}`);
            }
        });
      }, [])

    return(
           <MaterialTable
                columns={[
                    { title: 'Family' },
                    { title: 'Participant' },
                    { title: 'Affected' },
                    { title: 'Solved' },
                    { title: 'Tissue' },
                    { title: 'Dataset Types' },
                    { title: 'Condition' },
                    { title: 'Sequencing Date', field: 'sex', type: 'string', lookup: sexTypes },
                    
                ]}
                data={[]}
                title='Add Participants'
                options={{
                    paging: false,
                    selection: false,
                    search: false,
                    padding: 'dense',
                    sorting: false
                }}
                
                actions={[
                    {
                        icon: () => <Link className={classes.leftMostIcon}/>,
                        tooltip: "Link to dataset",
                        onClick: linkDataset,
                    },
                ]}
                localization={{
                    header: {
                        //remove action buttons' header
                        actions: "",
                    },
                }}
                onRowClick={(event, rowData) => {setActiveRow((rowData as Participant)); setDetail(true)}}
            />
    )
}
