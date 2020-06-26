import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Chip from '@material-ui/core/Chip';
import MaterialTable, { MTableToolbar } from 'material-table';

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

const rows = [
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

    return (
        <MaterialTable
            columns={[
                { title: 'Participant', field: 'participantID' },
                { title: 'Project', field: 'project' },
                { title: 'Uploader', field: 'uploader' },
                { title: 'Num. Samples', field: 'numSamples', type: 'numeric' },
                { title: 'Sex', field: 'sex', type: 'string' },
                { title: 'Created', field: 'created', type: 'string' }
            ]}
            data={rows}
            title={display}
            options={{
                pageSize: 10,
                selection: true
            }}
            editable={{
                onRowAdd: newData =>
                    new Promise((resolve, reject) => {
                        setTimeout(() => {
                            /* setData([...data, newData]); */

                            resolve();
                        }, 1000);
                    }),
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
                onRowDelete: oldData =>
                    new Promise((resolve, reject) => {
                        setTimeout(() => {
                            // const dataDelete = [...data];
                            // const index = oldData.tableData.id;
                            // dataDelete.splice(index, 1);
                            // setData([...dataDelete]);

                            resolve();
                        }, 1000);
                    })
            }}
            components={{
                Toolbar: props => (
                    <div>
                        <MTableToolbar {...props} />
                        <div style={{ marginLeft: '24px' }}>
                            <Chip label="CHEO" clickable className={classes.chip} />
                            <Chip label="SK" clickable className={classes.chip} />
                            <Chip label="ACH" clickable className={classes.chip} />
                            <Chip label="BCL" clickable className={classes.chip} />
                            <Chip label="Misc." clickable className={classes.chip} />
                        </div>
                    </div>
                ),
            }}
        />
    )
}
