import React, { useMemo, useState } from "react";
import { Column } from "material-table";
import { Analysis } from "../../typings";
import { Checkbox, ListItemText, MenuItem, Select } from "@material-ui/core";
import { usePipelinesQuery } from "../../hooks";

type FilterProps = Parameters<Required<Column<Analysis>>["filterComponent"]>[0];

/**
 * Dropdown filter for pipeline ids. Displays name + version.
 *
 * Copies parameters from material-table filterComponent
 */
export default function PipelineFilter(props: FilterProps) {
    const pipelinesQuery = usePipelinesQuery();
    const pipelines = useMemo(() => (pipelinesQuery.isSuccess ? pipelinesQuery.data : []), [
        pipelinesQuery,
    ]);
    // Selected pipeline_ids
    const [selected, setSelected] = useState<number[]>([]);

    function onFilterChange(event: React.ChangeEvent<{ value: unknown }>) {
        console.log(event.target.value);
        const newIds = event.target.value as number[];
        setSelected(newIds);
        const rowId = (props.columnDef as any).tableData.id;
        props.onFilterChanged(rowId, newIds.join(","));
    }

    return (
        <Select multiple value={selected} onChange={onFilterChange}>
            {pipelines.map(p => (
                <MenuItem key={p.pipeline_id} value={p.pipeline_id}>
                    <Checkbox checked={selected.indexOf(p.pipeline_id) > -1} />
                    <ListItemText primary={`${p.pipeline_name} ${p.pipeline_version}`} />
                </MenuItem>
            ))}
        </Select>
    );
}
