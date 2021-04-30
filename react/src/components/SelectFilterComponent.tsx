import React, { useState } from "react";
import { Column } from "@material-table/core";
import { MenuItem, Select } from "@material-ui/core";

/**
 * Unused. Standard filter component compatible with material-table.
 */
export default function SelectFilterComponent<RowData extends object>(props: {
    columnDef: Column<RowData>;
    onFilterChanged: (columnID: string, value: any) => void;
    options: string[];
}) {
    const [selected, setSelected] = useState("");

    function updateFilter(newSelection: string) {
        if (newSelection) {
            // https://github.com/mbrn/material-table/pull/2435
            const rowId = (props.columnDef as any).tableData.id;
            setSelected(newSelection);
            props.onFilterChanged(rowId, newSelection);
        }
    }

    return (
        <Select
            value={selected}
            onChange={e => updateFilter(e.target.value as string)}
            displayEmpty
            inputProps={{ "aria-label": `${props.columnDef.title} filter` }}
        >
            {props.options.map(label => (
                <MenuItem value={label} key={label}>
                    {label}
                </MenuItem>
            ))}
        </Select>
    );
}
