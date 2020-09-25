import React, { useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Chip, IconButton } from '@material-ui/core';
import MaterialTable, { MTableToolbar } from 'material-table';
import { PlayArrow, Delete, Cancel } from '@material-ui/icons';
import AnalysisRunnerDialog from './AnalysisRunnerDialog';

export interface Participant {
    participantID: string,
    project: string,
    uploader: string,
    numSamples: number,
    sex: string,
    created: string
}

export enum DisplayType {
    PARTICIPANT = "Participants",
    DATASET = "Datasets",
    FAMILY = "Families",
}

interface ParticipantsTableProps {
    display: DisplayType;
}

const useStyles = makeStyles(theme => ({
    chip: {
        color: "primary",
        marginRight: '10px',
        colorPrimary: theme.palette.primary,
    }
}));

function createParticipant(
    participantID: string,
    project: string,
    uploader: string,
    numSamples: number,
    sex: string,
    created: string) {
    return { participantID, project, uploader, numSamples, sex, created };
}

const rows: Participant[] = [
    createParticipant('AA0001', '3001', 'CHEO', 2, 'F', '2020-02-01'),
    createParticipant('AA0002', '3002', 'CHEO', 1, 'M', '2020-02-01'),
    createParticipant('AA0003', '3003', 'ACH', 1, 'F', '2020-02-01'),
    createParticipant('BB0001', '2001', 'SK', 1, 'F', '2020-03-11'),
    createParticipant('BB0002', '2002', 'BCL', 1, 'M', '2020-03-11'),
    createParticipant('BB0003', '2003', 'Misc', 1, 'F', '2020-03-11'),
    createParticipant('AA0004', '3012', 'CHEO', 2, 'M', '2020-05-23'),
    createParticipant('AA0005', '3013', 'SK', 2, 'M', '2020-05-23'),
];

export default function ParticipantsTable({ display }: ParticipantsTableProps) {
    const classes = useStyles();
    const [showRunner, setRunner] = useState(false);
    const [activeParticipants, setActiveParticipants] = useState<Participant[]>([]);
    const [centre, setCentre] = useState("");

    return (
        <div>
            <AnalysisRunnerDialog
                participants={activeParticipants}
                open={showRunner}
                onClose={() => setRunner(false)}
            />
            <MaterialTable
                columns={[
                    { title: 'Participant', field: 'participantID' },
                    { title: 'Project', field: 'project' },
                    { title: 'Uploader', field: 'uploader', defaultFilter: centre },
                    { title: 'Num. Samples', field: 'numSamples', type: 'numeric' },
                    { title: 'Sex', field: 'sex', type: 'string' },
                    { title: 'Created', field: 'created', type: 'string' }
                ]}
                data={rows}
                title={display}
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
                            <div style={{ marginLeft: '24px' }}>
                                <Chip label="CHEO" clickable className={classes.chip} onClick={() => setCentre("CHEO")} />
                                <Chip label="SK" clickable className={classes.chip} onClick={() => setCentre("SK")} />
                                <Chip label="ACH" clickable className={classes.chip} onClick={() => setCentre("ACH")} />
                                <Chip label="BCL" clickable className={classes.chip} onClick={() => setCentre("BCL")} />
                                <IconButton className={classes.chip} onClick={() => setCentre("")}> <Cancel/> </IconButton>
                            </div>
                        </div>
                    ),
                }}
                actions={[
                    {
                        tooltip: 'Delete the selected participants',
                        icon: Delete,
                        onClick: (evt, data) => {
                            const sampleString = (data as Participant[]).map((participant) => { return participant.participantID }).join(', ')
                            alert(`Withdraw all datasets and records associated with the samples: ${sampleString}`)
                        }
                    },
                    {
                        tooltip: 'Run an analysis with the selected datasets',
                        icon: PlayArrow,
                        onClick: (evt, data) => {
                            setActiveParticipants(data as Participant[])
                            setRunner(true)
                        }
                    }
                ]}
            />
        </div>
    )
}
