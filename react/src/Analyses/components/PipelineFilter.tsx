import React, { useMemo, useState } from "react";
import { Column } from "material-table";
import { Analysis, Pipeline } from "../../typings";
import { Checkbox, ListItemText, MenuItem, Select } from "@material-ui/core";
import { usePipelinesQuery } from "../../hooks";

type FilterProps = Parameters<Required<Column<Analysis>>["filterComponent"]>[0];

function pipelineName(p: Pipeline) {
    return `${p.pipeline_name} ${p.pipeline_version}`;
}

/**
 * Dropdown filter for pipeline ids. Displays name + version.
 *
 * Copies parameters from material-table filterComponent
 */
export default function PipelineFilter(props: FilterProps) {
    const pipelinesQuery = usePipelinesQuery();
    const pipelines = useMemo(() => {
        if (pipelinesQuery.isSuccess) {
            const obj: { [key: number]: Pipeline } = {};
            pipelinesQuery.data.forEach(p => {
                obj[p.pipeline_id] = p;
            });
            return obj;
        }
        return undefined;
    }, [pipelinesQuery]);
    // Selected pipeline_ids
    const [selected, setSelected] = useState<number[]>([]);

    function onFilterChange(event: React.ChangeEvent<{ value: unknown }>) {
        setSelected(event.target.value as number[]);
    }

    function onClose() {
        const rowId = (props.columnDef as any).tableData.id;
        props.onFilterChanged(rowId, selected.join(","));
    }

    return (
        <>
            {pipelines && (
                <Select
                    multiple
                    value={selected}
                    onChange={onFilterChange}
                    onClose={onClose}
                    renderValue={selected =>
                        (selected as number[]).map(id => pipelineName(pipelines[id])).join(", ")
                    }
                >
                    {Object.values(pipelines).map(p => (
                        <MenuItem key={p.pipeline_id} value={p.pipeline_id}>
                            <Checkbox checked={selected.indexOf(p.pipeline_id) > -1} />
                            <ListItemText primary={pipelineName(p)} />
                        </MenuItem>
                    ))}
                </Select>
            )}
        </>
    );
}
