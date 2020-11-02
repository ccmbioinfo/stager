import React from "react";
import { makeStyles } from "@material-ui/styles";
import Link from "@material-ui/core/Link";
import Grid from "@material-ui/core/Grid";
import Typography from "@material-ui/core/Typography";
import TrendingUp from "@material-ui/icons/TrendingUp";

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

const useStyles = makeStyles(theme => ({
    depositContext: {
        flex: 1,
    },
    icon: {
        height: 24,
        width: 24,
        color: "green",
    },
}));

export default function Card({ title, value, textSecondary, linkText, children }: CardProps) {
    const classes = useStyles();

    return (
        <React.Fragment>
            <Typography variant="h5" color="primary" gutterBottom>
                {title}
            </Typography>
            <Typography component="p" variant="h4">
                {value}
            </Typography>
            <Grid container>
                <Grid item xs={1}>
                    <TrendingUp className={classes.icon} />
                </Grid>
                <Grid item xs={11}>
                    <Typography
                        color="textSecondary"
                        gutterBottom
                        className={classes.depositContext}
                    >
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
