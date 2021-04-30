import React from "react";
import { Box, Container, Grid, Link, makeStyles, Typography } from "@material-ui/core";
import { Link as RouterLink } from "react-router-dom";

const useStyles = makeStyles(theme => ({
    appBarSpacer: theme.mixins.toolbar,
    content: {
        flexGrow: 1,
        height: "100vh",
        overflow: "auto",
    },
    container: {
        marginTop: theme.spacing(3),
        marginBottom: theme.spacing(3),
    },
    link: {
        color:
            theme.palette.type === "dark"
                ? theme.palette.primary.light
                : theme.palette.primary.main,
    },
}));

const NotFoundPage: React.FC<{}> = () => {
    const classes = useStyles();
    return (
        <main className={classes.content}>
            <div className={classes.appBarSpacer} />
            <Container className={classes.container} maxWidth={false}>
                <Box margin={8}>
                    <Grid direction="column" spacing={2} container>
                        <Typography align="center" variant="h1">
                            Not Found
                        </Typography>
                        <Typography align="center" variant="h5">
                            We're sorry, the page you are looking for does not exist.
                        </Typography>
                        <Typography align="center" variant="h6">
                            <Link className={classes.link} component={RouterLink} to="/">
                                Click here to return to the participants page
                            </Link>
                        </Typography>
                    </Grid>
                </Box>
            </Container>
        </main>
    );
};

export default NotFoundPage;
