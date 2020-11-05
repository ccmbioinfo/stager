import React, { useState, useEffect } from "react";
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
} from "@material-ui/core";
import { ExpandLess, ExpandMore, Dns } from "@material-ui/icons";
import { formatDateString } from "../utils/functions";
import { Dataset } from "../utils/typings";
import { FieldDisplay } from "../utils/components";

const useStyles = makeStyles(theme => ({
    listPaper: {
        padding: theme.spacing(1),
        margin: theme.spacing(1),
    },
    box: {
        padding: theme.spacing(2),
        margin: theme.spacing(1),
    },
    list: {
        margin: "0",
        padding: "0",
    },
}));

export default function DatasetList(props: { datasets: Dataset[] }) {
    const classes = useStyles();
    const [showDatasets, setShowDatasets] = useState<boolean[]>([]);
    const datasets = props.datasets;

    function clickDataset(index: number) {
        // toggle
        setShowDatasets(
            showDatasets.map((val, i) => {
                return index === i ? !val : val;
            })
        );
    }
    useEffect(() => {
        setShowDatasets(props.datasets.map(val => false));
    }, [props.datasets]);
    return (
        <List className={classes.list}>
            {datasets.map((dataset, index) => (
                <Paper key={`dataset-${index}`} className={classes.listPaper} elevation={1}>
                    <ListItem button onClick={() => clickDataset(index)}>
                        <ListItemIcon>
                            <Dns />
                        </ListItemIcon>
                        <ListItemText primary={`Dataset ID ${dataset.dataset_id}`} />
                        {showDatasets[index] ? <ExpandLess /> : <ExpandMore />}
                    </ListItem>
                    <Collapse in={showDatasets[index]}>
                        <Box className={classes.box}>
                            <Grid
                                container
                                spacing={2}
                                justify="space-evenly"
                            >
                                <Grid item xs={6}>
                                    <FieldDisplay
                                        title="Input HPF Path"
                                        value={dataset.input_hpf_path}
                                    />
                                    <FieldDisplay title="Condition" value={dataset.condition} />
                                    <FieldDisplay
                                        title="Extraction Protocol"
                                        value={dataset.extraction_protocol}
                                    />
                                    <FieldDisplay title="Capture Kit" value={dataset.capture_kit} />
                                    <FieldDisplay
                                        title="Library Prep Method"
                                        value={dataset.library_prep_method}
                                    />
                                    <FieldDisplay
                                        title="Library Prep Date"
                                        value={formatDateString(dataset.library_prep_date)}
                                    />
                                    <FieldDisplay title="Read Length" value={dataset.read_length} />
                                    <FieldDisplay title="Read Type" value={dataset.read_type} />
                                </Grid>
                                <Grid item xs={6}>
                                    <FieldDisplay
                                        title="Sequencing ID"
                                        value={dataset.sequencing_id}
                                    />
                                    <FieldDisplay
                                        title="Sequencing Centre"
                                        value={dataset.sequencing_centre}
                                    />
                                    <FieldDisplay
                                        title="Creation Time"
                                        value={formatDateString(dataset.created)}
                                    />
                                    <FieldDisplay title="Created By" value={dataset.created_by} />
                                    <FieldDisplay
                                        title="Last Updated"
                                        value={formatDateString(dataset.updated)}
                                    />
                                    <FieldDisplay title="Updated By" value={dataset.updated_by} />
                                    <FieldDisplay
                                        title="Discriminator"
                                        value={dataset.discriminator}
                                    />
                                </Grid>
                            </Grid>
                        </Box>
                    </Collapse>
                </Paper>
            ))}
        </List>
    );
}
