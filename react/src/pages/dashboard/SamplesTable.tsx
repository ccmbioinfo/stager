import React, { useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Chip from '@material-ui/core/Chip';
import MaterialTable, { MTableToolbar } from 'material-table';


export interface Sample {
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
        marginRight: '10px',
        '&.Mui-click': {
            backgroundColor: '#f50057',
        }
    }
}));

function createSample(
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

const rows: Sample[] = [
    createSample('AA0001', '3001', 'CHEO', 'Blood', 'WES', 'Proband', 2, 'F', '2020-02-01'),
    createSample('AA0002', '3001', 'CHEO', 'Blood', 'WES', 'Mother', 1, 'F', '2020-02-01'),
    createSample('AA0003', '3001', 'CHEO', 'Blood', 'WES', 'Father', 1, 'M', '2020-02-01'),
    createSample('BB0001', '2001', 'SK', 'Muscle', 'RNASeq', 'Proband', 1, 'F', '2020-03-11'),
    createSample('BB0002', '2002', 'BCL', 'Blood', 'WGS', 'Proband', 1, 'M', '2020-03-11'),
    createSample('CC0003', '2003', 'CHEO', 'Blood', 'WES', 'Proband', 1, 'F', '2020-03-11'),
    createSample('CC0004', '2003', 'CHEO', 'Blood', 'WES', 'Father', 1, 'M', '2020-05-23'),
    createSample('AA0005', '3012', 'SK', 'Saliva', 'WES', 'Proband', 1, 'M', '2020-05-23'),
    createSample('AA0047', '3001', 'ACH', 'Blood', 'WES', 'Proband', 2, 'M', '2020-02-01'),
    createSample('AA0049', '3001', 'ACH', 'Blood', 'WES', 'Sibling', 1, 'F', '2020-02-01'),
    createSample('AA0048', '3001', 'ACH', 'Blood', 'WES', 'Father', 1, 'M', '2020-02-01'),
];

export default function SamplesTable() {
    const classes = useStyles();
    const [centre, setCentre] = useState("");

    return (
        <div>
           <MaterialTable
                columns={[
                    { title: 'Project', field: 'project' },
                    { title: 'Participant', field: 'participantID' },
                    { title: 'Uploader', field: 'uploader' , defaultFilter: centre},
                    { title: 'Tissue', field: 'tissueType'},
                    { title: 'Data Type', field: 'dataType'},
                    { title: 'Relation', field: 'relation'},
                    { title: 'Sex', field: 'sex', type: 'string' },
                    { title: 'Uploaded', field: 'uploaded', type: 'string' }
                ]}
                data={rows}
                title='3012 Available Samples'
                options={{
                    pageSize: 10,
                    selection: false,

                }}
                components={{
                    Toolbar: props => (
                        <div>
                            <MTableToolbar {...props} />
                            <div style={{ marginLeft: '24px' }}>
                                <Chip label="CHEO" clickable className={classes.chip} onClick={() => setCentre("CHEO")}/>
                                <Chip label="SK" clickable className={classes.chip} onClick={() => setCentre("SK")}/>
                                <Chip label="ACH" clickable className={classes.chip} onClick={() => setCentre("ACH")}/>
                                <Chip label="BCL" clickable className={classes.chip} onClick={() => setCentre("BCL")}/>
                                <Chip label="x" clickable className={classes.chip} onClick={() => setCentre("")}/>
                            </div>
                        </div>
                    ),
                }}
            />
        </div>
    )
}
