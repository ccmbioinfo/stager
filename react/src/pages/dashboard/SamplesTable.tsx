import React, { useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Chip, IconButton } from '@material-ui/core';
import MaterialTable, { MTableToolbar } from 'material-table';
import { Cancel } from '@material-ui/icons';
import { rows } from './MockData'

const useStyles = makeStyles(theme => ({
    chip: {
        color: "primary",
        marginRight: '10px',
        colorPrimary: theme.palette.primary,
    }
}));



export default function SamplesTable() {
    const classes = useStyles();
    const [centre, setCentre] = useState("");

    return (
        <div>
           <MaterialTable
                columns={[
                    { title: 'Participant Code', field: 'participantCodename'},
                    { title: 'Family Code', field: 'familyCodename' },
                    { title: 'Participant Type', field: 'participantType' , defaultFilter: centre},
                    { title: 'Affected', field: 'affected', type: 'boolean'},
                    { title: 'Solved', field: 'solved', type: 'boolean'},
                    { title: 'Sex', field: 'sex', type: 'string'},
                    { title: 'Note', field: 'note', render: (rowData) => <p>...</p> },
                    { title: 'Dataset Types', field: 'datasetTypes' }
                ]}
                data={rows}
                title='Participants'
                options={{
                    pageSize: 10,
                    selection: false,
                    filtering: true,
                    search: false
                }}
                components={{
                    Toolbar: props => (
                        <div>
                            <MTableToolbar {...props} />
                            <div style={{ marginLeft: '24px' }}>
                                <Chip label="Proband" clickable className={classes.chip} onClick={() => setCentre("Proband")}/>
                                <Chip label="Mother" clickable className={classes.chip} onClick={() => setCentre("Mother")}/>
                                <Chip label="Father" clickable className={classes.chip} onClick={() => setCentre("Father")}/>
                                <Chip label="Sibling" clickable className={classes.chip} onClick={() => setCentre("Sibling")}/>
                                <IconButton className={classes.chip} onClick={() => setCentre("")}> <Cancel/> </IconButton>
                            </div>
                        </div>
                    ),
                }}
                
                
            />
        </div>
    )
}
