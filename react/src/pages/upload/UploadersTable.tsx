import React from 'react'
import MaterialTable, { MTableToolbar } from 'material-table';
import Chip from '@material-ui/core/Chip';
import { makeStyles, Theme } from '@material-ui/core/styles';
import HidableTextButton from './HidableTextButton';

const useStyles = makeStyles((theme: Theme) => ({
  chip: {
    color: "primary",
    marginRight: '10px',
    colorPrimary: theme.palette.primary,
  },
  button: {
    background: 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)',
    border: 0,
    borderRadius: 3,
    boxShadow: '0 3px 5px 2px rgba(255, 105, 135, .3)',
    color: 'white',
    height: 48,
    padding: '0 30px',
  },
}));

function createFile(name: string, filesUnlinked: number, filesUploaded: number, lastActive: string, secretKey: string) {
    return {name, filesUnlinked, filesUploaded, lastActive, secretKey};
}

const rows = [
    createFile('CHEO', 1, 234, '2020-02-01', 'g23ugioshga3089qygh'),
    createFile('ACH', 3, 11, '2020-02-01', 'g23ugioshga3089qygh'),
    createFile('SK', 5, 903, '2020-02-01', 'g23ugioshga3089qygh'),
    createFile('MTS', 1, 14, '2020-02-01', 'g23ugioshga3089qygh'),
    createFile('BTS', 8, 0, '2020-02-01', 'g23ugioshga3089qygh'),
];

export default function FilesTable() {
    const classes = useStyles();

    return (
      <MaterialTable
      columns={[
        { title: 'Organization', field: 'name' },
        { title: 'Files unlinked', field: 'filesUnlinked', type: 'numeric' },
        { title: 'Files uploaded', field: 'filesUploaded', type: 'string' },
        { title: 'Last Active', field: 'lastActive', type: 'string' },
        { title: 'Secret Key', field: 'secretKey', type: 'string', render: rowData => <HidableTextButton secretText={rowData.secretKey}/> }
      ]}
      data={rows}
      title={"Uploaders"}
      options={{
        pageSize : 10,
        selection: true
      }}
      components={{
        Toolbar: props => (
          <div>
            <MTableToolbar {...props} />
            <div style={{marginLeft: '24px'}}>
              <Chip label="CHEO" clickable className={classes.chip}/>
              <Chip label="SK" clickable className={classes.chip}/>
              <Chip label="ACH" clickable className={classes.chip}/>
              <Chip label="BCL" clickable className={classes.chip}/>
              <Chip label="Misc." clickable className={classes.chip}/>
            </div>
          </div>
        ),
      }}
    />
    )
  }