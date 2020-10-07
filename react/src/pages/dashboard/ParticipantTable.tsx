import React, { useState } from 'react';
import { makeStyles, Chip, IconButton, Typography } from '@material-ui/core';
import { Cancel, FileCopy } from '@material-ui/icons';
import MaterialTable, { MTableToolbar } from 'material-table';
import { Participant, rows } from './MockData';
import DatasetTypes from './DatasetTypes';
import ParticipantInfoDialog from './ParticipantInfoDialog';

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

type DatasetHash = { [key: string]: number }
const organizeDatasetTypes = (types: string[]) => types.reduce<DatasetHash>(
    (newTypes, type) => {
        if (newTypes[type]) {
            newTypes[type] += 1;
        } else {
            newTypes[type] = 1;
        }
        return newTypes;
    }, Object.create(null));

type LookupHash = { [key: string]: string };
const getLookupValues = (values: string[]) => {
    return values.reduce<LookupHash>((lookupValues, value) => {
        lookupValues[value] = value;
        return lookupValues
    }, {})
}

export default function ParticipantTable() {
    const classes = useStyles();
    const [filter, setFilter] = useState<string[]>([]);
    const [detail, setDetail] = useState(true);
    const [activeRow, setActiveRow] = useState<Participant | undefined>(rows[0]);

    const sexTypes = { 'F': 'Female', 'M': 'Male', 'O': 'Other' };
    const datasetTypes = getLookupValues(['CES', 'CGS', 'CPS', 'RES', 'RGS', 'RLM', 'RMM', 'RRS', 'RTA','WES', 'WGS','RNASeq', 'RCS', 'RDC', 'RDE']);
    const participantTypes = getLookupValues(['Proband', 'Mother', 'Father', 'Sibling']);

    async function CopyToClipboard(event: React.MouseEvent, rowData: Participant | Participant[]) {
        if(!Array.isArray(rowData)){
            const toCopy = rowData.participantCodename + "_" + rowData.familyCodename;
            await navigator.clipboard.writeText(toCopy);
        }
    }
    
    return (
        <div>
            {activeRow &&
                <ParticipantInfoDialog
                    open={detail}
                    participant={activeRow}
                    onClose={() => {setDetail(false);}}
                />}
           <MaterialTable
                columns={[
                    { title: 'Participant Codename', field: 'participantCodename', align: 'center'},
                    { title: 'Family Codename', field: 'familyCodename', align: 'center'},
                    { title: 'Participant Type', field: 'participantType' , align: 'center', lookup: participantTypes, defaultFilter: filter},
                    { title: 'Affected', field: 'affected', type: 'boolean', align: 'center'},
                    { title: 'Solved', field: 'solved', type: 'boolean', align: 'center'},
                    { title: 'Sex', field: 'sex', type: 'string', align: 'center', lookup: sexTypes},
                    { title: 'Note', field: 'note', width: "50%", render: (rowData) => <Typography>{ rowData.note }</Typography>},
                    { title: 'Dataset Types', field: 'datasetTypes', align: 'center', lookup: datasetTypes, render: (rowData) => <DatasetTypes datasetTypes={organizeDatasetTypes(rowData.datasetTypes)} />}
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
