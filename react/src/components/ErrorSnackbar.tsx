import React, { forwardRef, useCallback, useState } from "react";
import { Card, CardActions, Collapse, IconButton, Paper, Typography } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import classnames from "classnames";
import { SnackbarContent } from "notistack";

const useStyles = makeStyles(theme => ({
    root: {
        [theme.breakpoints.up("sm")]: {
            minWidth: "344px !important",
        },
    },
    card: {
        backgroundColor: "#d33030",
        width: "100%",
    },
    actionRoot: {
        padding: "8px 8px 8px 16px",
        justifyContent: "space-between",
    },
    icons: {
        marginLeft: "auto",
    },
    expand: {
        padding: "8px 8px",
        transform: "rotate(0deg)",
        transition: theme.transitions.create("transform", {
            duration: theme.transitions.duration.shortest,
        }),
    },
    expandOpen: {
        transform: "rotate(180deg)",
    },
    collapse: {
        padding: 16,
    },
}));

const ErrorSnackbar = forwardRef<
    HTMLDivElement,
    { errorMessage: string; userMessage: string | undefined }
>((props, ref) => {
    const classes = useStyles();

    const [expanded, setExpanded] = useState(false);

    const handleExpandClick = useCallback(() => {
        setExpanded(oldExpanded => !oldExpanded);
    }, []);

    return (
        <SnackbarContent ref={ref} className={classes.root}>
            <Card className={classes.card}>
                <CardActions classes={{ root: classes.actionRoot }}>
                    <Typography variant="subtitle2" style={{ color: "white" }}>
                        {props.userMessage}
                    </Typography>
                    <div className={classes.icons}>
                        <IconButton
                            aria-label="Show more"
                            className={classnames(classes.expand, {
                                [classes.expandOpen]: expanded,
                            })}
                            onClick={handleExpandClick}
                        >
                            <ExpandMoreIcon style={{ color: "white" }} />
                        </IconButton>
                    </div>
                </CardActions>
                <Collapse in={expanded} timeout="auto" unmountOnExit>
                    <Paper className={classes.collapse}>
                        <Typography variant="body2" gutterBottom>
                            {props.errorMessage}
                        </Typography>
                    </Paper>
                </Collapse>
            </Card>
        </SnackbarContent>
    );
});

export default ErrorSnackbar;
