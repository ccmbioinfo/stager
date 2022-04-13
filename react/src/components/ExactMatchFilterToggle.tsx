import React, { useEffect, useState } from "react";
import { Column } from "@material-table/core";
import { Checkbox, makeStyles, TextField, Tooltip } from "@material-ui/core";
import { updateSearchTypeAndRequery } from "../functions";
import { DatasetDetailed, Participant } from "../typings";

interface ExactMatchFilterToggleProps {
    MTRef: React.MutableRefObject<any>;
    columnDef: Column<Participant> | Column<DatasetDetailed>;
    onFilterChanged: (rowId: string, value: any) => void;
}

const useStyles = makeStyles(() => ({
    input: {
        "& .MuiInputBase-input": {
            width: 60,
            "&:focus": {
                width: 120,
                transition: "width 0.35s ease-in-out",
            },
        },
    },
}));

export default function ExactMatchFilterToggle(props: ExactMatchFilterToggleProps) {
    const classes = useStyles();
    const [exactMatch, setExactMatch] = useState<boolean>(false);

    useEffect(() => {
        // This component should never be used with a non-text field to begin with
        if (props.columnDef.field && !Array.isArray(props.columnDef.field)) {
            updateSearchTypeAndRequery(props.MTRef, {
                column: props.columnDef.field,
                exact: exactMatch,
            });
        }
    }, [props.MTRef, props.columnDef.field, exactMatch]);

    return (
        <TextField
            className={classes.input}
            id="input-with-icon-textfield"
            onChange={event => {
                props.onFilterChanged((props.columnDef as any).tableData.id, event.target.value);
            }}
            InputProps={{
                startAdornment: (
                    <Tooltip title="Only show exact match">
                        <Checkbox
                            color="primary"
                            size="small"
                            onChange={event => setExactMatch(event.target.checked)}
                        />
                    </Tooltip>
                ),
            }}
            variant="standard"
        />
    );
}
