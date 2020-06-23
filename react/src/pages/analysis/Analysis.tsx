import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Container from '@material-ui/core/Container';
import Grid from '@material-ui/core/Grid';
import Paper from '@material-ui/core/Paper';
import Table from '@material-ui/core/Table';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import TableCell from '@material-ui/core/TableCell';
import TableBody from '@material-ui/core/TableBody';

import Title from '../Title';

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'fill',
  },
  appBarSpacer: theme.mixins.toolbar,
  content: {
    flexGrow: 1,
    height: '100vh',
    overflow: 'auto',
  },
  container: {
    paddingTop: theme.spacing(3),
    paddingBottom: theme.spacing(3),
  },
  paper: {
    padding: theme.spacing(2),
    display: 'flex',
    overflow: 'auto',
    flexDirection: 'column',
  },
  seeMore: {
    marginTop: theme.spacing(3),
  }
}));

// generate fake analysis data
function createAnalysis(id: number, dateSubmitted: string, project: string, pipeline: string, timeElapsed: string, status: string): 
{id: number, dateSubmitted: string, project: string, pipeline: string, timeElapsed: string, status: string} {
  return {id, dateSubmitted, project, pipeline, timeElapsed, status};
}

const analyses : {id: number, dateSubmitted: string, project: string, pipeline: string, timeElapsed: string, status: string}[] = [
  createAnalysis(0, '2020-05-23', '1000', 'CRE', '-', 'Pending'),
  createAnalysis(1, '2020-06-13', '2030', 'CRE', '-', 'Pending'),
  createAnalysis(2, '2020-06-19', '4030', 'CRG', '-', 'Pending'),
  createAnalysis(0, '2020-06-22', '3291', 'CRG', '2hrs', 'Running'),
  createAnalysis(1, '2020-06-21', '3289', 'CRE', '17hrs', 'Running'),
  createAnalysis(2, '2020-06-21', '2382', 'CRG', '20hrs', 'Running'),
  createAnalysis(0, '2020-06-19', '4182', 'CRG', '47hrs', 'Completed'),
  createAnalysis(1, '2020-06-19', '3271', 'CRE', '20hrs', 'Completed'),
  createAnalysis(2, '2020-06-20', '3839', 'CRE', '22hrs', 'Error'),
]

export default function Analysis() {
  const classes = useStyles();
  return (
    <main className={classes.content}>
      <div className={classes.appBarSpacer} />
      <Container maxWidth="lg" className={classes.container}>
        <Grid container spacing={0}>
          {/* Recent Orders */}
          <Grid item xs={12}>
            <Paper className={classes.paper}>
            <Title>Active Analyses</Title>
            <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Submitted</TableCell>
                <TableCell>Project</TableCell>
                <TableCell>Pipeline</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {analyses.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.dateSubmitted}</TableCell>
                  <TableCell>{row.project}</TableCell>
                  <TableCell>{row.pipeline}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </Paper>
          </Grid>
        </Grid>
      </Container>
    </main>
  );
}
