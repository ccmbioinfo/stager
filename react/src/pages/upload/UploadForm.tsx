import React, { useState } from 'react';

import { makeStyles, Theme } from '@material-ui/core/styles';

import FormControl from '@material-ui/core/FormControl';
import Input from '@material-ui/core/Input';
import InputLabel from '@material-ui/core/InputLabel';

import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';


import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import Grid from '@material-ui/core/Grid';
import FilesTable from './FilesTable';
import MaterialTable from 'material-table';
import { Divider, IconButton } from '@material-ui/core';
import { AddCircle } from '@material-ui/icons';


interface UploadDialogProps {
  open: boolean,
  onClose: (() => void),
}

const useStyles = makeStyles(theme => ({
  root: {
  },
  dialog: {
    paddingBottom: theme.spacing(5),
    paddingTop: theme.spacing(0),
    paddingLeft: theme.spacing(0),
    paddingRight: theme.spacing(0),
  },
  margin: {
    margin: theme.spacing(1)
  },
  padding: {
      paddingTop: theme.spacing(4),
  },
  tabs: {
      paddingTop: theme.spacing(0),
  }
}));

// Types for generating form rows
// TODO: better way to do this; pull DB columns from server schema maybe?

enum Sex {
  Male   = 'M',
  Female = 'F',
  Other  = 'Other'
}

enum DatasetType {
 WES    = 'WES',
 WGS    = 'WGS',
 CES    = 'CES',
 CGS    = 'CGS',
 CPS    = 'CPS',
 RNASeq = 'RNASeq',
 Other  = 'Other'
}

enum Relation {
  Proband = "Proband",
  Mother  = "Mother",
  Father  = "Father",
  Sibling = "Sibling",
  Other   = "Other"
}

enum Condition {
  Germline = "Germline",
  Somatic  = "Somatic",
  Control  = "Control"
}

enum TissueType {
  Blood      = "Blood",
  Saliva     = "Saliva",
  Lymphocyte = "Lymphocyte",
  Fibroblast = "Fibroblast",
  Skin       = "Skin",
  Urine      = "Urine",
  Plasma     = "Plasma",
  Kidney     = "Kidney",
  Unknown    = "Unknown"
}

interface DatasetRow {
  familyCode: string,
  participantCode: string,
  participantSex: Sex,
  datasetType: DatasetType,
  participantType: Relation,
  datasetCondition: Condition,
  tissueType: TissueType
}

const DatasetColumnNames: Record<string, string> = {
  "familyCode" : "Family ID",
  "participantCode" : "Participant ID",
  "participantSex" : "Sex",
  "datasetType" : "Type",
  "participantType" : "Relation",
  "datasetCondition" : "Condition",
  "tissueType" : "Tissue"
};

export default function UploadForm() {
    const classes = useStyles();

    const [rows, setRows] = useState<DatasetRow[]>([]);

    const [columns, setColumns] = useState(() => {
      var columns = [];
      for (let key in DatasetColumnNames) {
        let colToAdd: any = { title: DatasetColumnNames[key], field: key};
        switch (key) {
          case "participantSex":
            colToAdd.lookup = {...Object.values(Sex)};
            break;
          case "datasetType":
            colToAdd.lookup = {...Object.values(DatasetType)};
            break;
          case "participantType":
            colToAdd.lookup = {...Object.values(Relation)};
            break;
          case "datasetCondition":
            colToAdd.lookup = {...Object.values(Condition)};
            break;
          case "tissueType":
            colToAdd.lookup = {...Object.values(TissueType)};
            break;
        }
        columns.push(colToAdd);
      }
      return columns;
    });

    return (
      <MaterialTable
        title="Rows to Add"
        columns={columns}
        data={rows}
        editable={{
          onRowAdd: newRow => 
            new Promise((resolve, reject) => {
              // TODO: check that FamilyID and ParticipantID are unique
              setRows([...rows, newRow]);
              resolve();
            }),
          onRowUpdate: (newRow, oldRow) => 
            new Promise((resolve, reject) => {
              // TODO: check that FamilyID and ParticipantID are unique
              if (!oldRow)
                reject();
              const newRows = [...rows];
              const index = newRows.indexOf(oldRow!);
              newRows[index] = newRow;
              setRows([...newRows]);
              resolve();
            }),
          onRowDelete: oldRow =>
            new Promise((resolve, reject) => {
              if (!oldRow)
                reject();
              const newRows = [...rows];
              const index = newRows.indexOf(oldRow!);
              newRows.splice(index, 1);
              setRows([...newRows]);
              resolve();
            })
        }}
        options={{
          search: false,
          actionsColumnIndex: -1
        }}
        />
    );
}
