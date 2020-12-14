import React, { useState } from "react";
import { FormControl, MenuItem, Select } from "@material-ui/core";
import { Column } from "material-table";
import { PseudoBoolean, PseudoBooleanReadableMap } from "../typings";

/**
 * A controlled component to override material-table columns' editComponent prop.
 */
export default function BooleanFilter<RowData extends object>(props: {
    columnDef: Column<RowData>;
    onFilterChanged: (columnID: string, value: any) => void;
}) {
    const options = Object.keys(PseudoBooleanReadableMap) as PseudoBoolean[];
    const [value, setValue] = useState<PseudoBoolean | "">("");

    return (
        <FormControl>
            <Select
                fullWidth
                value={value}
                onChange={e => {
                    setValue(e.target.value as PseudoBoolean);
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
