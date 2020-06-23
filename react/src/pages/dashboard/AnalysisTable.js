import React from 'react';
import Link from '@material-ui/core/Link';
import { makeStyles } from '@material-ui/core/styles';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Grid from '@material-ui/core/Grid';
import Paper from '@material-ui/core/Paper';
import Title from '../Title';

// generate fake analysis data
function createAnalysis(id, dateSubmitted, project, pipeline, timeElapsed, status) {
  return {id, dateSubmitted, project, pipeline, timeElapsed, status};
}

const pending = [
  createAnalysis(0, '2020-05-23', '1000', 'CRE', '-', 'Pending'),
  createAnalysis(1, '2020-06-13', '2030', 'CRE', '-', 'Pending'),
  createAnalysis(2, '2020-06-19', '4030', 'CRG', '-', 'Pending'),
]

const running = [
  createAnalysis(0, '2020-06-22', '3291', 'CRG', '2hrs', 'Running'),
  createAnalysis(1, '2020-06-21', '3289', 'CRE', '17hrs', 'Running'),
  createAnalysis(2, '2020-06-21', '2382', 'CRG', '20hrs', 'Running'),
]

const completed = [
  createAnalysis(0, '2020-06-19', '4182', 'CRG', '47hrs', 'Completed'),
  createAnalysis(1, '2020-06-19', '3271', 'CRE', '20hrs', 'Completed'),
  createAnalysis(2, '2020-06-20', '3839', 'CRE', '22hrs', 'Error'),
]

function preventDefault(event) {
  event.preventDefault();
}

const useStyles = makeStyles((theme) => ({
  seeMore: {
    marginTop: theme.spacing(3),
  },
}));

export default function AnalysisTable() {
  const classes = useStyles();
  return (
    <Grid container spacing={2}>
      <Grid item xs={4}>
      <Title>Pending Analyses</Title>
      <Paper variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Submitted</TableCell>
            <TableCell>Project</TableCell>
            <TableCell>Pipeline</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {pending.map((row) => (
            <TableRow key={row.id}>
              <TableCell>{row.dateSubmitted}</TableCell>
              <TableCell>{row.project}</TableCell>
              <TableCell>{row.pipeline}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      </Paper>
      <div className={classes.seeMore}>
        <Link color="primary" href="#" onClick={preventDefault}>
          See all pending analyses
        </Link>
      </div>
      </Grid>
      <Grid item xs={4}>
      <Title>Running Analyses</Title>
      <Paper variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Submitted</TableCell>
            <TableCell>Project</TableCell>
            <TableCell>Pipeline</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {running.map((row) => (
            <TableRow key={row.id}>
              <TableCell>{row.dateSubmitted}</TableCell>
              <TableCell>{row.project}</TableCell>
              <TableCell>{row.pipeline}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      </Paper>
      <div className={classes.seeMore}>
        <Link color="primary" href="#" onClick={preventDefault}>
          See all running analyses 
        </Link>
      </div>
      </Grid>
      <Grid item xs={4}>
      <Title>Completed Analyses</Title>
      <Paper variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Submitted</TableCell>
            <TableCell>Project</TableCell>
            <TableCell>Pipeline</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {completed.map((row) => (
            <TableRow key={row.id}>
              <TableCell>{row.dateSubmitted}</TableCell>
              <TableCell>{row.project}</TableCell>
              <TableCell>{row.pipeline}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      </Paper>
      <div className={classes.seeMore}>
        <Link color="primary" href="#" onClick={preventDefault}>
          See all completed analyses
        </Link>
      </div>
      </Grid>
    </Grid>
  );
}
