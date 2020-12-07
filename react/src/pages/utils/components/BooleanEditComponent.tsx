import React from "react";
import { FormControl, MenuItem, Select } from "@material-ui/core";
import { PseudoBoolean, PseudoBooleanReadableMap } from "../typings";
import { EditCellColumnDef, EditComponentProps } from "material-table";

/**
 * A controlled component to override material-table columns' editComponent prop.
 */
export default function BooleanEditComponent<RowData extends object>(
    props: EditComponentProps<RowData>
) {
    const options = Object.keys(PseudoBooleanReadableMap) as PseudoBoolean[];

    return (
        <FormControl error={Boolean(props.error)}>
            <Select
                fullWidth
                value={props.value}
                onChange={e => props.onChange(e.target.value as PseudoBoolean)}
                SelectDisplayProps={{ "aria-label": props.columnDef.title }}
            >
                {options.map(key => (
                    <MenuItem value={key}>{PseudoBooleanReadableMap[key]}</MenuItem>
                ))}
            </Select>
        </FormControl>
    );
}
