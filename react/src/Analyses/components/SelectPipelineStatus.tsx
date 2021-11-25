import React, { useMemo, useState } from "react";
import { EditComponentProps } from "@material-table/core";
import { ListSubheader, MenuItem, Select, SelectProps } from "@material-ui/core";
import { useUserContext } from "../../contexts";
import { checkPipelineStatusChange } from "../../functions";
import { Analysis, PipelineStatus } from "../../typings";

export default function SelectPipelineStatus(props: EditComponentProps<Analysis>) {
    const userClient = useUserContext();
    const [oldValue] = useState<PipelineStatus>(props.value);
    const options = useMemo(() => {
        if (userClient.user.is_admin) {
            const [valid, invalid] = Object.values(PipelineStatus).reduce<PipelineStatus[][]>(
                (prev, curr) => {
                    if (curr === oldValue || checkPipelineStatusChange(oldValue, curr)) {
                        prev[0].push(curr);
                        return prev;
                    } else {
                        prev[1].push(curr);
                        return prev;
                    }
                },
                [[], []]
            );

            return [
                <ListSubheader key="ValidStateHeader">Valid States</ListSubheader>,
                valid.map(value => (
                    <MenuItem value={value} key={value}>
                        {value === oldValue ? <b>{value}</b> : value}
                    </MenuItem>
                )),
                <ListSubheader key="InvalidStateHeader">Invalid States</ListSubheader>,
                invalid.map(value => (
                    <MenuItem value={value} key={value}>
                        {value}
                    </MenuItem>
                )),
            ].flat();
        }
        return Object.values(PipelineStatus)
            .filter(
                state =>
                    props.value === state ||
                    state === oldValue ||
                    checkPipelineStatusChange(oldValue, state)
            )
            .map(value => (
                <MenuItem value={value} key={value}>
                    {value}
                </MenuItem>
            ));
    }, [props.value, oldValue, userClient.user.is_admin]);

    const handleChange: SelectProps["onChange"] = e => {
        const newValue = e.target.value as string;
        props.onChange(newValue);
    };

    return (
        <Select value={props.value} onChange={handleChange}>
            {options}
        </Select>
    );
}
