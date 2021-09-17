import React, { useEffect, useState } from "react";
import { Column } from "@material-table/core";
import {
    FormGroup,
    FormHelperText,
    InputAdornment,
    makeStyles,
    Switch,
    TextField,
} from "@material-ui/core";
import { FilterList } from "@material-ui/icons";
import { updateTableFilter } from "../functions";
import { Dataset } from "../typings";

const useStyles = makeStyles(theme => ({
    root: {
        marginBottom: theme.spacing(1.5),
    },
}));

interface ExactMatchFilterToggleProps {
    MTRef: React.MutableRefObject<any>;
    columnDef: Column<Dataset>;
    onFilterChanged: (rowId: string, value: any) => void;
}

export default function ExactMatchFilterToggle(props: ExactMatchFilterToggleProps) {
    const classes = useStyles();
    const [exactMatch, setExactMatch] = useState<boolean>(false);

    useEffect(() => {
        updateTableFilter(
            props.MTRef,
            `${props.columnDef.field}_exact_match`,
            exactMatch.toString()
        );
    }, [props.MTRef, props.columnDef.field, exactMatch]);

    return (
        <>
            <FormGroup className={classes.root}>
                <FormHelperText>Exact match</FormHelperText>
                <Switch size="small" onChange={event => setExactMatch(event.target.checked)} />
            </FormGroup>
            <TextField
                id="input-with-icon-textfield"
                onChange={event => {
                    props.onFilterChanged(
                        (props.columnDef as any).tableData.id,
                        event.target.value
                    );
                }}
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <FilterList />
                        </InputAdornment>
                    ),
                }}
                variant="standard"
            />
        </>
    );
}

//   updateTableFilter(
//     MTRef,
//     "dataset_type",
//     datasetTypes
// )
