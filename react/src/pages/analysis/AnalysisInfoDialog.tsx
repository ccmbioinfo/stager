import React from 'react';
import { createStyles, Theme, makeStyles, withStyles, WithStyles } from '@material-ui/core/styles';
import Dialog from '@material-ui/core/Dialog';
import MuiDialogTitle from '@material-ui/core/DialogTitle';
import MuiDialogContent from '@material-ui/core/DialogContent';
import IconButton from '@material-ui/core/IconButton';
import CloseIcon from '@material-ui/icons/Close';
import Typography from '@material-ui/core/Typography';
import Divider from '@material-ui/core/Divider';
import Chip from '@material-ui/core/Chip';
import SamplesTable from './SamplesTable';

interface AlertInfoDialogProp {
    title: string,
    open: boolean,
    samples: string[],
    onClose: (() => void),
}

const styles = (theme: Theme) =>
  createStyles({
    root: {
      margin: 0,
      padding: theme.spacing(2),
    },
    closeButton: {
      position: 'absolute',
      right: theme.spacing(1),
      top: theme.spacing(1),
      color: theme.palette.grey[500],
    },
  });

export interface DialogTitleProps extends WithStyles<typeof styles> {
  id: string;
  children: React.ReactNode;
  onClose: () => void;
}

const DialogTitle = withStyles(styles)((props: DialogTitleProps) => {
  const { children, classes, onClose, ...other } = props;
  return (
    <MuiDialogTitle disableTypography className={classes.root} {...other}>
      <Typography variant="h6">{children}</Typography>
      {onClose ? (
        <IconButton aria-label="close" className={classes.closeButton} onClick={onClose}>
          <CloseIcon />
        </IconButton>
      ) : null}
    </MuiDialogTitle>
  );
});

const DialogContent = withStyles((theme: Theme) => ({
  root: {
    padding: theme.spacing(2),
  },
}))(MuiDialogContent);

const makeChipStyle = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      display: 'flex',
      justifyContent: 'center',
      flexWrap: 'wrap',
      '& > *': {
        margin: theme.spacing(0.5),
      },
    },
  }),
);

const pipelineParams: string[] = ["gnomAD_AF <= 0.01", "trio", "joint_genotyping", "denovo", "IMPACT_SEVERITY=HIGH",]
const analyses: string[] = ["SNP", "INDELs",]
const annotations: string[] = ["OMIM 2020-07-01", "HGMD 2019-02-03", "snpEff 4.3T", "gnomAD v2.1.1"]

export default function AnalysisInfoDialog({title, samples, open, onClose}: AlertInfoDialogProp) {

    const chipStyle = makeChipStyle();
  return (
    <div>
      <Dialog onClose={onClose} aria-labelledby="customized-dialog-title" open={open} maxWidth='md' fullWidth={true}>
        <DialogTitle id="customized-dialog-title" onClose={onClose}>
          {title}
        </DialogTitle>
        <DialogContent dividers>
        <Typography variant="h6" gutterBottom>
            CRE - Clinical Research Exome
          </Typography>
          <div className={chipStyle.root}>
            {analyses.map( (analysis) =>
                <Chip size="medium" color="primary" label={analysis} />
            )}
            {pipelineParams.map( (chipValue) =>
                <Chip size="medium" label={chipValue} />
            )}
            {annotations.map( (annotation) =>
                <Chip size="medium" color="secondary" label={annotation} />
            )}
          </div>
          <Typography variant="h6" gutterBottom>
            Details
          </Typography>
          <Divider/>
          <Typography variant="body1" gutterBottom>
            Submitted by: CHEO
          </Typography>
          <Typography variant="body1" gutterBottom>
            Status: Running
          </Typography>
          <Typography variant="body1" gutterBottom>
            Date submitted: 2020-04-01
          </Typography>
          <Typography variant="body1" gutterBottom>
            Runtime: 24:00:01
          </Typography>
          <Typography variant="h6" gutterBottom>
            Samples
          </Typography>
          <SamplesTable/>
        </DialogContent>
      </Dialog>
    </div>
  );
}