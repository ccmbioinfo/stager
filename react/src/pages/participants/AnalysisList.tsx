import React, { useState, useEffect } from "react";
import { formatDateString } from "../utils/functions";
import { Analysis } from "../utils/typings";
import { FieldDisplay } from "../utils/components";
import {
    Box,
    Collapse,
    Grid,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    makeStyles,
    Paper,
    Typography,
} from "@material-ui/core";
import { ExpandLess, ExpandMore, ShowChart } from "@material-ui/icons";

const useStyles = makeStyles(theme => ({
    listPaper: {
        margin: theme.spacing(1),
    },
    grid: {
        paddingBottom: theme.spacing(2),
    },
    box: {
        padding: theme.spacing(2),
        margin: theme.spacing(1),
    },
}));

export default function AnalysisList(props: { analyses: Analysis[] }) {
    const classes = useStyles();
    const [showAnalysis, setShowAnalysis] = useState<boolean[]>([]);
    const analyses = props.analyses;

    function clickAnalysis(index: number) {
        console.log("clicked");
        // toggle
        console.log(index);
        console.log(showAnalysis);
        setShowAnalysis(
            showAnalysis.map((val, i) => {
                console.log(index === i ? !val : val);

                return index === i ? !val : val;
            })
        );
        console.log(showAnalysis);
    }
    useEffect(() => {
        setShowAnalysis(props.analyses.map(val => false));
    }, [props.analyses]);
    return (
        <div>
            <Typography variant="h6">Analyses</Typography>
            <List>
                {analyses.map((analysis, index) => (
                    <Paper key={`analysis-${index}`} className={classes.listPaper} elevation={1}>
                        <ListItem button onClick={() => clickAnalysis(index)}>
                            <ListItemIcon>
                                <ShowChart />
                            </ListItemIcon>
                            <ListItemText
                                primary={`Analysis ID ${analysis.analysis_id}`}
                                secondary={`Current State: ${analysis.analysis_state} - Click for more details`}
                            />
                            {showAnalysis[index] ? <ExpandLess /> : <ExpandMore />}
                        </ListItem>
                        <Collapse in={showAnalysis[index]}>
                            <Box className={classes.box}>
                                <Grid
                                    container
                                    spacing={2}
                                    justify="space-evenly"
                                    className={classes.grid}
                                >
                                    <Grid item xs={6}>
                                        <FieldDisplay
                                            title="Analysis ID"
                                            value={analysis.analysis_id}
                                        />
                                        <FieldDisplay
                                            title="State"
                                            value={analysis.analysis_state}
                                        />
                                        <FieldDisplay
                                            title="Pipeline ID"
                                            value={analysis.pipeline_id}
                                        />
                                        <FieldDisplay
                                            title="Assigned to"
                                            value={analysis.assignee}
                                        />
                                        <FieldDisplay
                                            title="HPF Path"
                                            value={analysis.result_hpf_path}
                                        />
                                        <FieldDisplay title="qSub ID" value={analysis.qsubID} />
                                    </Grid>
                                    <Grid item xs={6}>
                                        <FieldDisplay title="Notes" value={analysis.notes} />
                                        <FieldDisplay
                                            title="Requested"
                                            value={formatDateString(analysis.requested)}
                                        />
                                        <FieldDisplay
                                            title="Requested By"
                                            value={analysis.requester}
                                        />
                                        <FieldDisplay
                                            title="Started"
                                            value={formatDateString(analysis.started)}
                                        />
                                        <FieldDisplay
                                            title="Last Updated"
                                            value={formatDateString(analysis.updated)}
                                        />
                                    </Grid>
                                </Grid>
                            </Box>
                        </Collapse>
                    </Paper>
                ))}
            </List>
        </div>
    );
}
