import React, { useEffect, useState } from "react";
import {
    List,
    ListItemIcon,
    ListItem,
    Paper,
    ListItemText,
    Collapse,
    Typography,
} from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { Dns, ExpandLess, ExpandMore } from "@material-ui/icons";
import { Dataset } from "./utils/typings";
import { DatasetDetailSection } from "./datasets/DialogSections";

const useStyles = makeStyles(theme => ({
    paper: {
        padding: theme.spacing(2),
    },
    listPaper: {
        padding: theme.spacing(1),
        margin: theme.spacing(1),
    },
    box: {
        padding: theme.spacing(2),
        margin: theme.spacing(1),
    },
}));
interface DatasetListProp {
    datasets: Dataset[];
    showTitle: boolean;
}
export default function DatasetList({ datasets, showTitle }: DatasetListProp) {
    const [showDatasets, setShowDatasets] = useState<boolean[]>([]);
    const classes = useStyles();

    function clickDataset(index: number) {
        setShowDatasets(showDatasets.map((value, i) => (i === index ? !value : value)));
    }
    useEffect(() => {
        setShowDatasets(datasets.map(val => false));
    }, [datasets]);

    return (
        <>
            {showTitle && <Typography variant="h6">Associated Datasets</Typography>}

            <List>
                {datasets.map((dataset, index) => (
                    <Paper key={`analysis-${index}`} className={classes.listPaper} elevation={1}>
                        <ListItem button onClick={() => clickDataset(index)}>
                            <ListItemIcon>
                                <Dns />
                            </ListItemIcon>
                            <ListItemText
                                primary={`Dataset ID ${dataset.dataset_id}`}
                                secondary={`Participant: ${dataset.participant_codename} - Click for more details`}
                            />
                            {showDatasets[index] ? <ExpandLess /> : <ExpandMore />}
                        </ListItem>
                        <Collapse in={showDatasets[index]}>
                            <DatasetDetailSection dataset={dataset} elevation={0} />
                        </Collapse>
                    </Paper>
                ))}
            </List>
        </>
    );
}
