import React from "react";
import { Column } from "@material-table/core";
import { FormControl, MenuItem, Select } from "@material-ui/core";
import { PseudoBoolean, PseudoBooleanReadableMap } from "../typings";

/**
 * A controlled component to override material-table columns' editComponent prop.
 */
export default function BooleanFilter<RowData extends object>(props: {
    columnDef: Column<RowData>;
    onFilterChanged: (columnID: string, value: any) => void;
}) {
    const options = Object.keys(PseudoBooleanReadableMap) as PseudoBoolean[];

    return (
        <FormControl>
            <Select
                fullWidth
                value={(props.columnDef as any).tableData.filterValue}
                onChange={e => {
                    props.onFilterChanged((props.columnDef as any).tableData.id, e.target.value);
                }}
            >
                <MenuItem value="" key="blank">
                    (Blank)
                </MenuItem>
                {options.map(key => (
                    <MenuItem value={key} key={key}>
                        {PseudoBooleanReadableMap[key]}
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
    );
}
