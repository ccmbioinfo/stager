import React, { useEffect, useState } from "react";
import { Column } from "@material-table/core";
import { InputAdornment, makeStyles, Switch, TextField, Tooltip } from "@material-ui/core";
import { FilterList } from "@material-ui/icons";
import { updateSearchTypeAndRequery } from "../functions";
import { Dataset, Participant } from "../typings";

interface ExactMatchFilterToggleProps {
    MTRef: React.MutableRefObject<any>;
    columnDef: Column<Participant> | Column<Dataset>;
    onFilterChanged: (rowId: string, value: any) => void;
}

export default function ExactMatchFilterToggle(props: ExactMatchFilterToggleProps) {
    const [exactMatch, setExactMatch] = useState<boolean>(false);

    useEffect(() => {
        if (props.columnDef.field) {
            updateSearchTypeAndRequery(props.MTRef, {
                column: props.columnDef.field,
                exact: exactMatch,
            });
        }
    }, [props.MTRef, props.columnDef.field, exactMatch]);

    return (
        <TextField
            id="input-with-icon-textfield"
            onChange={event => {
                props.onFilterChanged((props.columnDef as any).tableData.id, event.target.value);
            }}
            InputProps={{
                startAdornment: (
                    <InputAdornment position="start">
                        <FilterList />
                    </InputAdornment>
                ),
                endAdornment: (
                    <Tooltip title="Only show exact match">
                        <Switch
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
