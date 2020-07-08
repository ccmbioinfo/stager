import React, { useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Chip from '@material-ui/core/Chip';
import MaterialTable, { MTableToolbar } from 'material-table';


export interface Participant {
    participantID: string,
    project: string,
    uploader: string,
    tissueType: string,
    dataType: string,
    relation: string,
    numSamples: number,
    sex: string,
    uploaded: string
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
    tissueType: string,
    dataType: string,
    relation: string,
    numSamples: number,
    sex: string,
    uploaded: string,
    ) {
    return { participantID, project, uploader, tissueType, dataType, relation, numSamples, sex, uploaded };
}

const rows: Participant[] = [
    createParticipant('AA0001', '3001', 'CHEO', 'Blood', 'WES', 'Proband', 2, 'F', '2020-02-01'),
    createParticipant('AA0002', '3001', 'CHEO', 'Blood', 'WES', 'Mother', 1, 'F', '2020-02-01'),
    createParticipant('AA0003', '3001', 'CHEO', 'Blood', 'WES', 'Father', 1, 'M', '2020-02-01'),
    createParticipant('BB0001', '2001', 'SK', 'Muscle', 'RNASeq', 'Proband', 1, 'F', '2020-03-11'),
    createParticipant('BB0002', '2002', 'BCL', 'Blood', 'WGS', 'Proband', 1, 'M', '2020-03-11'),
    createParticipant('CC0003', '2003', 'CHEO', 'Blood', 'WES', 'Proband', 1, 'F', '2020-03-11'),
    createParticipant('CC0004', '2003', 'CHEO', 'Blood', 'WES', 'Father', 1, 'M', '2020-05-23'),
    createParticipant('AA0005', '3012', 'SK', 'Saliva', 'WES', 'Proband', 1, 'M', '2020-05-23'),
];

export default function SamplesTable() {
    const classes = useStyles();

    return (
        <div>
           <MaterialTable
                columns={[
                    { title: 'Project', field: 'project' },
                    { title: 'Participant', field: 'participantID' },
                    { title: 'Uploader', field: 'uploader' },
                    { title: 'Tissue', field: 'tissueType'},
                    { title: 'Data Type', field: 'dataType'},
                    { title: 'Relation', field: 'relation'},
                    { title: 'Sex', field: 'sex', type: 'string' },
                    { title: 'Uploaded', field: 'uploaded', type: 'string' }
                ]}
                data={rows}
                title='Available Samples'
                options={{
                    pageSize: 10,
                    selection: false,

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
                            </div>
                        </div>
                    ),
                }}
            />
        </div>
    )
}
