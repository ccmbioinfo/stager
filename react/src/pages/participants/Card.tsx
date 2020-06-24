import React from 'react';
import Link from '@material-ui/core/Link';
import { makeStyles } from '@material-ui/styles';
import Typography from '@material-ui/core/Typography';
import Grid from '@material-ui/core/Grid';
import TrendingUp from '@material-ui/icons/TrendingUp';
import Title from './Title';

export interface CardProps {
    title: string;
    value: string;
    textSecondary: string;
    linkText: string;
    children: React.ReactNode;
}

function preventDefault(event: any) {
  event.preventDefault();
}

const useStyles = makeStyles((theme) => ({
  depositContext: {
    flex: 1,
  },
  icon: {
    height: 24,
    width: 24,
    color: 'green',
  },
}));

export default function Card({title, value, textSecondary, linkText, children}: CardProps) {
  const classes = useStyles();

  return (
    <React.Fragment>
      <Title>{title}</Title>
      <Typography component="p" variant="h4">
        {value}
      </Typography>
      <Grid container>
      <Grid item xs={1} >
        <TrendingUp className={classes.icon} />
      </Grid>
      <Grid item xs={11}>
        <Typography color="textSecondary" gutterBottom className={classes.depositContext}>
          {textSecondary}
        </Typography>
      </Grid>
      </Grid>
      {children}
      <div>
        <Link color="primary" href="#" onClick={preventDefault}>
          {linkText}
        </Link>
      </div>
    </React.Fragment>
  );
}