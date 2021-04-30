import React, { useState } from "react";
import { Column } from "@material-table/core";
import { IconButton, InputAdornment, makeStyles, TextField, Tooltip } from "@material-ui/core";
import { NavigateBefore } from "@material-ui/icons";
import clsx from "clsx";

const useStyles = makeStyles(theme => ({
    button: {
        transform: "rotate(0deg)",
        transition: theme.transitions.create("transform", {
            duration: theme.transitions.duration.shortest,
        }),
    },
    buttonFlipped: {
        transform: "rotate(180deg)",
    },
}));

/**
 * A filter component for material-table for sorting before or after
 * a specific date. Passes up a value of the format "{before,after},yyyy-mm-dd".
 */
export default function DateFilterComponent<RowData extends object>(props: {
    columnDef: Column<RowData>;
    onFilterChanged: (rowId: string, value: any) => void;
}) {
    const classes = useStyles();
    const [isBefore, setIsBefore] = useState(true);
    const [date, setDate] = useState("");

    function updateFilter(newBefore: boolean, newDate: string) {
        // don't update if the date is not entered yet
        if (date || newDate) {
            // https://github.com/mbrn/material-table/pull/2435
            const rowId = (props.columnDef as any).tableData.id;
            props.onFilterChanged(rowId, `${newBefore ? "before" : "after"},${newDate}`);
        }
    }

    return (
        <TextField
            id="date"
            type="date"
            value={date}
            InputProps={{
                startAdornment: (
                    <InputAdornment position="start">
                        <Tooltip title={isBefore ? "Before" : "After"}>
                            <IconButton
                                size="small"
                                className={clsx(classes.button, {
                                    [classes.buttonFlipped]: !isBefore,
                                })}
                                onClick={e => {
                                    setIsBefore(prev => {
                                        updateFilter(!prev, date);
                                        return !prev;
                                    });
                                }}
                            >
                                <NavigateBefore />
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
