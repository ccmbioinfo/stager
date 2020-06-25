import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Container from '@material-ui/core/Container';
import Grid from '@material-ui/core/Grid';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import Divider from '@material-ui/core/Divider';
import TextField from '@material-ui/core/TextField';
import FormControl from '@material-ui/core/FormControl'
import { Input, InputLabel, Button } from '@material-ui/core';

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
  dividingSpacer: {
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(3),
  },
  inputText: {
    marginTop: theme.spacing(2),
    maxWidth: "33%",
  },
  submitButton: {
    marginTop: theme.spacing(3),
    float: "right",
   }
  
}));

const user : string = "example_user"

export default function Settings() {
  const classes = useStyles();
  return (
    <main className={classes.content}>
      <div className={classes.appBarSpacer} />
      <Container maxWidth="lg" className={classes.container}>
        <Paper className={classes.paper}>
          <Typography>
          Logged In As <b>{user}</b> 
          </Typography>
          <Divider className={classes.dividingSpacer}/>
          <Typography>
            Change Password:
          </Typography>
          <FormControl className={classes.inputText} size="small">
            <InputLabel htmlFor="current">Current Password</InputLabel>
            <Input
              id="current"
              type="password"
            />
          </FormControl>
          <FormControl className={classes.inputText} size="small">
            <InputLabel htmlFor="new">New Password</InputLabel>
            <Input
              id="new"
              type="password"
            />
          </FormControl>
          <FormControl className={classes.inputText} size="small">
            <InputLabel htmlFor="repeat">Repeat New Password</InputLabel>
            <Input
              id="repeat"
              type="password"
            />
          </FormControl>
          <Grid container spacing={2}>
            <Grid item xs={4}>
              <Button className={classes.submitButton} variant="contained" color="secondary">
                Update Password 
              </Button> 
            </Grid>
         </Grid>
        </Paper>
      </Container>
    </main>
  );
}
