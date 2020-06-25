import React from 'react';
import Card from './Card';
import Chart from './Chart.js';

import { makeStyles, Theme } from '@material-ui/core/styles';
import Container from '@material-ui/core/Container';
import Grid from '@material-ui/core/Grid';
import Paper from '@material-ui/core/Paper';
import ParticipantsTable, { DisplayType } from './ParticipantsTable';

const useStyles = makeStyles((theme: Theme) => ({
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
  fixedHeight: {
    height: 240,
  },
}));

export default function Participants() {
  const classes = useStyles();
  const [display, setDisplay] = React.useState(DisplayType.PARTICIPANT);

  return (
    <main className={classes.content}>
      <div className={classes.appBarSpacer} />
      <Container maxWidth="lg" className={classes.container}>
        <Grid container spacing={2}>
          <Grid item xs={4}>
            <Paper className={classes.paper}>
              <Card title={"Participants"} value={"2731"} textSecondary={"12 since last week"} linkText={"Particpant View"}>
                <Chart />
                </Card>
            </Paper>
          </Grid>
          <Grid item xs={4}>
            <Paper className={classes.paper}>
            <Card title={"Datasets"} value={"3012"} textSecondary={"3 CES, 5 RES since last week"} linkText={"Dataset View"} children=""/>
            </Paper>
          </Grid>
          <Grid item xs={4}>
            <Paper className={classes.paper}>
              <Card title={"Families"} value={"728"} textSecondary={"2 since last week"} linkText={"Family View"} children=""/>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    <Container >
      <Grid container spacing={0}>
        <Grid item xs={12}>
          <ParticipantsTable display={display}/>
        </Grid>
      </Grid>
    </Container>
    </main>
  );
}