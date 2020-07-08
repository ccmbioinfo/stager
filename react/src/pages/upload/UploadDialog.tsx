import React from 'react';

import { makeStyles } from '@material-ui/core/styles';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import FormControl from '@material-ui/core/FormControl';
import Input from '@material-ui/core/Input';
import InputLabel from '@material-ui/core/InputLabel';
import DialogContent from '@material-ui/core/DialogContent';
import Typography from '@material-ui/core/Typography';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import Button from '@material-ui/core/Button';
import ButtonGroup from '@material-ui/core/ButtonGroup';
import ExpansionPanel from '@material-ui/core/ExpansionPanel';
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails';
import ExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import Grid from '@material-ui/core/Grid';
import FilesTable from '../upload/FilesTable';


interface UploadDialogProps {
  open: boolean,
  onClose: (() => void),
}

const useStyles = makeStyles(theme => ({
  root: {
  },
  dialog: {
    paddingBottom: theme.spacing(5)
  },
  margin: {
    margin: theme.spacing(1)
  },
  padding: {
      paddingTop: theme.spacing(4)
  }
}));

export default function UploadDialog({open, onClose}: UploadDialogProps ) {
  const classes = useStyles();
  return (
  <Dialog
    open={open}
    onClose={() => onClose()}
    fullWidth={true}
    maxWidth='md'
  >
    <DialogTitle>
      Enter Sample Metadata
    </DialogTitle>
    <DialogContent dividers className={classes.dialog}>
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
      <Grid container className={classes.padding} spacing={2}>
        <ExpansionPanel >
            <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>Link to Existing Dataset</Typography>
            </ExpansionPanelSummary>
            <ExpansionPanelDetails>
                <FilesTable/>
            </ExpansionPanelDetails>
        </ExpansionPanel>
      </Grid>
      <Grid container className={classes.padding} spacing={2}>
        <Grid item xs={4}>
        <ButtonGroup variant="contained">
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={onClose}color="primary">Add</Button>
        </ButtonGroup>
        </Grid>
      </Grid>
    </DialogContent>
  </Dialog>

  )
}
