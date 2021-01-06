import React from "react";
import { FormControl, Input, InputLabel, MenuItem, Select } from "@material-ui/core";

/**
 * A controlled multiselect component for selecting permission group codes from
 * a provided list of codes.
 */
export default function GroupDropdownSelect(props: {
    allGroupCodes: string[];
    selectedGroupCodes: string[];
    onChange: (selectedCodes: string[]) => void;
    disabled?: boolean;
}) {
    function handleChange(event: React.ChangeEvent<{ value: unknown }>) {
        // material-ui docs do the typing this way for some reason
        props.onChange(event.target.value as string[]);
    }

    return (
        <div>
            <FormControl disabled={props.disabled}>
                <InputLabel id="permission-group-select-label">Permission Groups</InputLabel>
                <Select
                    labelId="permission-group-select-label"
                    id="permission-group-select"
                    multiple
                    value={props.selectedGroupCodes}
                    onChange={handleChange}
                    input={<Input />}
                >
                    {props.allGroupCodes.map(code => (
                        <MenuItem key={code} value={code}>
                            {code.toUpperCase()}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>
        </div>
    );
}
