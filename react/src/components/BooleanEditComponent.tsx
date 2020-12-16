import React from "react";
import { FormControl, MenuItem, Select } from "@material-ui/core";
import { EditComponentProps } from "material-table";
import { PseudoBoolean, PseudoBooleanReadableMap } from "../typings";

/**
 * A controlled component to override material-table columns' editComponent prop.
 */
export default function BooleanEditComponent<RowData extends object>(
    props: Pick<EditComponentProps<RowData>, "value" | "onChange"> &
        Partial<Exclude<EditComponentProps<RowData>, "value" | "onChange">>
) {
    const options = Object.keys(PseudoBooleanReadableMap) as PseudoBoolean[];

    return (
        <FormControl error={Boolean(props.error)}>
            <Select
                fullWidth
                value={props.value}
                onChange={e => props.onChange(e.target.value as PseudoBoolean)}
                SelectDisplayProps={{ "aria-label": props.columnDef?.title }}
            >
                {options.map(key => (
                    <MenuItem value={key} key={key}>
                        {PseudoBooleanReadableMap[key]}
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
    );
}
