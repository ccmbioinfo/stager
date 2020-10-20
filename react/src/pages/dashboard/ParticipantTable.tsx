import React, { useState, useEffect } from 'react';
import { makeStyles, Chip, IconButton, Typography } from '@material-ui/core';
import { Cancel, FileCopy } from '@material-ui/icons';
import MaterialTable, { MTableToolbar } from 'material-table';
import { countArray, toKeyValue } from '../utils';
import { Participant, Sample, Dataset } from './MockData';
import DatasetTypes from './DatasetTypes';
import ParticipantDetailDialog from './ParticipantDetailDialog';

const useStyles = makeStyles(theme => ({
    chip: {
        color: "primary",
        marginRight: '10px',
        colorPrimary: theme.palette.primary,
    },
    copyIcon: {
        marginLeft: theme.spacing(1),
    }
}));

export default function ParticipantTable() {
    const classes = useStyles();
    const [filter, setFilter] = useState<string[]>([]);
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [detail, setDetail] = useState(false);
    const [activeRow, setActiveRow] = useState<Participant | undefined>(undefined);

    const sexTypes = { 'F': 'Female', 'M': 'Male', 'O': 'Other' };
    const datasetTypes = toKeyValue(['CES', 'CGS', 'CPS', 'RES', 'RGS', 'RLM', 'RMM', 'RRS', 'RTA','WES', 'WGS','RNASeq', 'RCS', 'RDC', 'RDE']);
    const participantTypes = toKeyValue(['Proband', 'Mother', 'Father', 'Sibling']);

    async function CopyToClipboard(event: React.MouseEvent, rowData: Participant | Participant[]) {
        if(!Array.isArray(rowData)){
            const toCopy = rowData.participant_codename + "_" + rowData.family_codename;
            await navigator.clipboard.writeText(toCopy);
        }
    }

    useEffect(() => {
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
                setParticipants(participants);
            } else {
                console.error(`GET /api/participants failed with ${response.status}: ${response.statusText}`);
            }
        });
      }, [])

    return (
        <div>
            {activeRow &&
                <ParticipantDetailDialog
                    open={detail}
                    participant={activeRow}
                    onClose={() => setDetail(false)}
                />}
           <MaterialTable
                columns={[
                    { title: 'Participant Codename', field: 'participant_codename', align: 'center'},
                    { title: 'Family Codename', field: 'family_codename', align: 'center'},
                    { title: 'Participant Type', field: 'participant_type' , align: 'center', lookup: participantTypes, defaultFilter: filter},
                    { title: 'Affected', field: 'affected', type: 'boolean', align: 'center'},
                    { title: 'Solved', field: 'solved', type: 'boolean', align: 'center'},
                    { title: 'Sex', field: 'sex', type: 'string', align: 'center', lookup: sexTypes},
                    { title: 'Notes', field: 'notes', width: "50%", render: (rowData) => <Typography>{ rowData.notes }</Typography>},
                    { title: 'Dataset Types', field: 'dataset_types', align: 'center', lookup: datasetTypes, render: (rowData) => <DatasetTypes datasetTypes={countArray(rowData.dataset_types)} />}
                ]}
                data={participants}
                title='Participants'
                options={{
                    pageSize: 10,
                    selection: false,
                    filtering: true,
                    search: false,
                    padding: 'dense',
                }}
                components={{
                    Toolbar: props => (
                        <div>
                            <MTableToolbar {...props} />
                            <div style={{ marginLeft: '24px' }}>
                                <Chip label="Proband" clickable className={classes.chip} onClick={() => setFilter(["Proband"])} />
                                <Chip label="Mother" clickable className={classes.chip} onClick={() => setFilter(["Mother"])} />
                                <Chip label="Father" clickable className={classes.chip} onClick={() => setFilter(["Father"])} />
                                <Chip label="Sibling" clickable className={classes.chip} onClick={() => setFilter(["Sibling"])} />
                                <IconButton className={classes.chip} onClick={() => setFilter([])}> <Cancel /> </IconButton>
                            </div>
                        </div>
                    ),
                }}
                actions={[
                    {
                        icon: () => <FileCopy className={classes.copyIcon}/>,
                        tooltip: "Copy combined codename",
                        onClick: CopyToClipboard,
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
        </div>
    )
}
