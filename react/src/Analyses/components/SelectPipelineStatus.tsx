import React, { useMemo } from "react";
import { MenuItem, Select } from "@material-ui/core";
import { EditComponentProps } from "material-table";
import { Analysis, PipelineStatus } from "../../typings";
import { checkPipelineStatusChange } from "../../functions";

export default function SelectPipelineStatus(props: EditComponentProps<Analysis>) {
    const options = useMemo(
        () =>
            Object.values(PipelineStatus)
                .filter(
                    state => props.value === state || checkPipelineStatusChange(props.value, state)
                )
                .map(value => <MenuItem value={value}>{value}</MenuItem>),
        [props.value]
    );

    return (
        <Select value={props.value} onChange={e => props.onChange(e.target.value)}>
            {options}
        </Select>
    );
}
