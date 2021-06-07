import React, { useMemo, useState } from "react";
import { Column } from "@material-table/core";
import { Checkbox, FormControl, ListItemText, MenuItem, Select } from "@material-ui/core";
import { usePipelinesQuery } from "../../hooks";
import { Analysis, Pipeline } from "../../typings";

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
    const pipelinesObj = useMemo(() => {
        if (pipelinesQuery.isSuccess) {
            const obj: { [key: number]: Pipeline } = {};
            pipelinesQuery.data.forEach(p => {
                obj[p.pipeline_id] = p;
            });
            return obj;
        }
        return undefined;
    }, [pipelinesQuery]);

    const pipelineList = useMemo(
        () => (pipelinesQuery.isSuccess ? pipelinesQuery.data : []),
        [pipelinesQuery]
    );

    // Filter value is a string of comma-separated pipeline IDs
    const filterValue: number[] =
        (props.columnDef as any).tableData.filterValue?.split(",").map((i: string) => Number(i)) ||
        [];

    // Selected pipeline_ids
    const [selected, setSelected] = useState(filterValue);

    function onFilterChange(event: React.ChangeEvent<{ value: unknown }>) {
        setSelected(event.target.value as number[]);
    }

    function onClose() {
        const rowId = (props.columnDef as any).tableData.id;
        props.onFilterChanged(rowId, selected.join(","));
    }

    return (
        <FormControl style={{ width: "100%" }}>
            {pipelinesObj && pipelineList && (
                <Select
                    multiple
                    value={selected}
                    onChange={onFilterChange}
                    onClose={onClose}
                    renderValue={selected =>
                        (selected as number[]).map(id => pipelineName(pipelinesObj[id])).join(", ")
                    }
                >
                    {pipelineList.map(p => (
                        <MenuItem key={p.pipeline_id} value={p.pipeline_id}>
                            <Checkbox checked={selected.indexOf(p.pipeline_id) > -1} />
                            <ListItemText primary={pipelineName(p)} />
                        </MenuItem>
                    ))}
                </Select>
            )}
        </FormControl>
    );
}
