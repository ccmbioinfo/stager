import React, { useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Chip, IconButton } from '@material-ui/core';
import MaterialTable, { MTableToolbar } from 'material-table';
import { Cancel } from '@material-ui/icons';
import FileCopyIcon from '@material-ui/icons/FileCopy';

import { Participant, rows } from './MockData';
import Note from './Note';
import DatasetTypes from './DatasetTypes';

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

const organizeDatasetTypes = (types: string[]) => {
    const newTypes : {[key: string]: number}= {};
    types.map(type => {
        if(newTypes.hasOwnProperty(type)){
            newTypes[type] += 1;
        }else{
            newTypes[type] = 1;
        }
    })
    return newTypes
}

export default function ParticipantTable() {
    const classes = useStyles();
    const [centre, setCentre] = useState("");

    async function CopyToClipboard(event: React.MouseEvent, rowData: Participant | Participant []) {
        if(!Array.isArray(rowData)){
            const toCopy = rowData.participantCodename + "_" + rowData.familyCodename;
            await navigator.clipboard.writeText(toCopy);
        }
    }
    
    return (
        <div>
           <MaterialTable
                columns={[
                    { title: 'Participant Codename', field: 'participantCodename', align: 'center',},
                    { title: 'Family Codename', field: 'familyCodename', align: 'center',},
                    { title: 'Participant Type', field: 'participantType' , align: 'center', defaultFilter: centre},
                    { title: 'Affected', field: 'affected', type: 'boolean', align: 'center',},
                    { title: 'Solved', field: 'solved', type: 'boolean', align: 'center',},
                    { title: 'Sex', field: 'sex', type: 'string', align: 'center',},
                    { title: 'Note', field: 'note', width: "50%", render: (rowData) => <Note rowData={rowData}/>},
                    { title: 'Dataset Types', field: 'datasetTypes', align: 'center', render: (rowData) => <DatasetTypes datasetTypes={organizeDatasetTypes(rowData.datasetTypes)} />}
                ]}
                data={rows}
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
                                <Chip label="Proband" clickable className={classes.chip} onClick={() => setCentre("Proband")} />
                                <Chip label="Mother" clickable className={classes.chip} onClick={() => setCentre("Mother")} />
                                <Chip label="Father" clickable className={classes.chip} onClick={() => setCentre("Father")} />
                                <Chip label="Sibling" clickable className={classes.chip} onClick={() => setCentre("Sibling")} />
                                <IconButton className={classes.chip} onClick={() => setCentre("")}> <Cancel /> </IconButton>
                            </div>
                        </div>
                    ),
                }}
                actions={[
                    {
                        icon: () => <FileCopyIcon className={classes.copyIcon}/>,
                        tooltip: 'Copy Participant Codename_Family Codename',
                        onClick: CopyToClipboard,
                    },
                ]}
                localization={{
                    header: {
                        actions: '',
                    },
                }}
            />
        </div>
    )
}
