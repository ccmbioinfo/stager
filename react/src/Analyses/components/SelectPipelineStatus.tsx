import React, { useMemo } from "react";
import { MenuItem, Select, ListSubheader } from "@material-ui/core";
import { EditComponentProps } from "material-table";
import { Analysis, PipelineStatus } from "../../typings";
import { checkPipelineStatusChange } from "../../functions";
import { useUserContext } from "../../contexts";

export default function SelectPipelineStatus(props: EditComponentProps<Analysis>) {
    const userClient = useUserContext();
    const options = useMemo(() => {
        if (userClient.user.is_admin) {
            const [valid, invalid] = Object.values(PipelineStatus).reduce(
                (prev, curr) => {
                    if (curr === props.value || checkPipelineStatusChange(props.value, curr)) {
                        prev[0].push(curr);
                        return prev;
                    } else {
                        prev[1].push(curr);
                        return prev;
                    }
                },
                [[], []] as string[][]
            );

            return (
                <>
                    <ListSubheader>Valid States</ListSubheader>
                    {valid.map(value => (
                        <MenuItem value={value}>{value}</MenuItem>
                    ))}
                    <ListSubheader>Invalid States</ListSubheader>
                    {invalid.map(value => (
                        <MenuItem value={value}>{value}</MenuItem>
                    ))}
                </>
            );
        }
        return Object.values(PipelineStatus)
            .filter(state => props.value === state || checkPipelineStatusChange(props.value, state))
            .map(value => <MenuItem value={value}>{value}</MenuItem>);
    }, [props.value, userClient]);

    return (
        <Select value={props.value} onChange={e => props.onChange(e.target.value)}>
            {options}
        </Select>
    );
}
