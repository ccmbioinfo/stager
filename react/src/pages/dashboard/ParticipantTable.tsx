import React, { useState } from 'react';
import { makeStyles, Chip, IconButton, Typography } from '@material-ui/core';
import { Cancel, FileCopy } from '@material-ui/icons';
import MaterialTable, { MTableToolbar } from 'material-table';
import { Participant, rows } from './MockData';
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
    const newTypes: {[key: string]: number} = {};
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
    const [filter, setFilter] = useState("");

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
                    { title: 'Participant Type', field: 'participantType' , align: 'center', defaultFilter: filter},
                    { title: 'Affected', field: 'affected', type: 'boolean', align: 'center',},
                    { title: 'Solved', field: 'solved', type: 'boolean', align: 'center',},
                    { title: 'Sex', field: 'sex', type: 'string', align: 'center',},
                    { title: 'Note', field: 'note', width: "50%", render: (rowData) => <Typography>{rowData.note}</Typography>},
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
                                <Chip label="Proband" clickable className={classes.chip} onClick={() => setFilter("Proband")} />
                                <Chip label="Mother" clickable className={classes.chip} onClick={() => setFilter("Mother")} />
                                <Chip label="Father" clickable className={classes.chip} onClick={() => setFilter("Father")} />
                                <Chip label="Sibling" clickable className={classes.chip} onClick={() => setFilter("Sibling")} />
                                <IconButton className={classes.chip} onClick={() => setFilter("")}> <Cancel /> </IconButton>
                            </div>
                        </div>
                    ),
                }}
                actions={[
                    {
                        icon: () => <FileCopy className={classes.copyIcon}/>,
                        tooltip: 'Copy Participant Codename_Family Codename',
                        onClick: CopyToClipboard,
                    },
                ]}
                localization={{
                    header: {
                        //remove action buttons' header 
                        actions: '',
                    },
                }}
            />
        </div>
    )
}
