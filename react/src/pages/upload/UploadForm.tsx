import React from 'react';

import { makeStyles, Theme } from '@material-ui/core/styles';

import FormControl from '@material-ui/core/FormControl';
import Input from '@material-ui/core/Input';
import InputLabel from '@material-ui/core/InputLabel';

import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';


import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import Grid from '@material-ui/core/Grid';
import FilesTable from './FilesTable';


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
    margin: theme.spacing(1),
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

interface datasetRow {
  familyCode: string,
  participantCode: string,
  participantSex: Sex,
  datasetType: DatasetType,
  participantType: Relation,
  datasetCondition: Condition,
  tissueType: TissueType
}

export default function UploadForm() {
    const classes = useStyles();

    

    return (
      <form>
      <FormControl className={classes.margin}>
        <InputLabel shrink htmlFor="family-code">Family ID</InputLabel>
        <Input id="family-code"/>
      </FormControl>
      <FormControl className={classes.margin}>
        <InputLabel shrink htmlFor="participant-code">Participant ID</InputLabel>
        <Input id="participant-code"/>
      </FormControl>
      <FormControl className={classes.margin}>
        <InputLabel shrink htmlFor="participant-sex">Sex</InputLabel>
        <Select id="participant-sex">
          <MenuItem value={'F'}>F</MenuItem>
          <MenuItem value={'M'}>M</MenuItem>
          <MenuItem value={'Other'}>Other</MenuItem>
        </Select>
      </FormControl>
      <FormControl className={classes.margin}>
        <InputLabel shrink htmlFor="dataset-type">Type</InputLabel>
        <Select autoWidth={true} id="dataset-type">
          <MenuItem value={'WES'}>WES</MenuItem>
          <MenuItem value={'WGS'}>WGS</MenuItem>
          <MenuItem value={'CES'}>CES</MenuItem>
          <MenuItem value={'CGS'}>CGS</MenuItem>
          <MenuItem value={'CPS'}>CPS</MenuItem>
          <MenuItem value={'RNASeq'}>RNASeq</MenuItem>
          <MenuItem value={'Other'}>Other</MenuItem>
        </Select>
      </FormControl>
      <FormControl className={classes.margin}>
        <InputLabel shrink htmlFor="participant-type">Relation</InputLabel>
        <Select autoWidth={true} id="participant-type">
          <MenuItem value={'Proband'}>Proband</MenuItem>
          <MenuItem value={'Mother'}>Mother</MenuItem>
          <MenuItem value={'Father'}>Father</MenuItem>
          <MenuItem value={'Sibling'}>Sibling</MenuItem>
          <MenuItem value={'Other'}>Other</MenuItem>
        </Select>
      </FormControl>
      <FormControl className={classes.margin}>
        <InputLabel shrink htmlFor="dataset-condition">Condition</InputLabel>
        <Select autoWidth={true} id="participant-type">
          <MenuItem value={'Germline'}>Germline</MenuItem>
          <MenuItem value={'Somatic'}>Somatic</MenuItem>
          <MenuItem value={'Control'}>Control</MenuItem>
        </Select>
      </FormControl>
      <FormControl className={classes.margin}>
        <InputLabel shrink htmlFor="tissue-type">Tissue</InputLabel>
        <Select autoWidth={true} id="tissue-type">
          <MenuItem value={'Blood'}>Blood</MenuItem>
          <MenuItem value={'Saliva'}>Saliva</MenuItem>
          <MenuItem value={'Lymphocyte'}>Lymphocyte</MenuItem>
          <MenuItem value={'Fibroblast'}>Fibroblast</MenuItem>
          <MenuItem value={'Skin'}>Skin</MenuItem>
          <MenuItem value={'Urine'}>Urine</MenuItem>
          <MenuItem value={'Plasma'}>Plasma</MenuItem>
          <MenuItem value={'Kidney'}>Kidney</MenuItem>
          <MenuItem value={'Unknown'}>Unknown</MenuItem>
        </Select>
      </FormControl>
      </form>
  )
}
