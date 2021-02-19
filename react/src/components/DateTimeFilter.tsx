import React, { useState } from "react";
import { Column } from "material-table";
import { IconButton, InputAdornment, TextField, Tooltip } from "@material-ui/core";
import { NavigateBefore, NavigateNext } from "@material-ui/icons";

export default function DateTimeFilter<RowData extends object>(props: {
    columnDef: Column<RowData>;
    onFilterChanged: (rowId: string, value: any) => void;
}) {
    const [isBefore, setIsBefore] = useState(true);
    const [date, setDate] = useState("");

    function updateFilter(newBefore: boolean, newDate: string) {
        const rowId = (props.columnDef as any).tableData.id;
        props.onFilterChanged(rowId, `${newBefore ? "before" : "after"},${newDate}`);
    }

    return (
        <TextField
            id="date"
            type="date"
            value={date}
            label={`${props.columnDef.title || "Date"} ${isBefore ? "Before" : "After"}`}
            InputProps={{
                startAdornment: (
                    <InputAdornment position="start">
                        <Tooltip title={isBefore ? "Before Date" : "After Date"}>
                            <IconButton
                                size="small"
                                onClick={e => {
                                    setIsBefore(prev => {
                                        // idk if this is even legal
                                        updateFilter(!prev, date);
                                        return !prev;
                                    });
                                }}
                            >
                                {isBefore ? <NavigateBefore /> : <NavigateNext />}
                            </IconButton>
                        </Tooltip>
                    </InputAdornment>
                ),
            }}
            InputLabelProps={{
                shrink: true,
            }}
            onChange={e => {
                setDate(e.target.value);
                updateFilter(isBefore, e.target.value);
            }}
        />
    );
}
