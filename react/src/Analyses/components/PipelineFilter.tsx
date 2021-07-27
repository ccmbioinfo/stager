import React, { useEffect, useMemo, useState } from "react";
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
    // we can't treat this as a real lookup field b/c dataManager will only run the appropriate checks if the `lookup` \
    // prop is set: https://github.com/material-table-core/core/blob/master/src/utils/data-manager.js#L665
    // so we need to treat it like a string filter as far as MT is concerned

    const stringValToArray = (filterVal: string) =>
        filterVal.split(",").map(Number).filter(Boolean);

    const filterValue = useMemo(
        () => ((props.columnDef as any).tableData.filterValue as string) || "",
        // [ props.columnDef ] will not trigger the rerender.
        // https://github.com/material-table-core/core/blob/master/src/components/MTableFilterRow/LookupFilter.js#L31
        /* eslint-disable react-hooks/exhaustive-deps */
        [(props.columnDef as any).tableData.filterValue as string]
    );

    const [selected, setSelected] = useState(stringValToArray(filterValue));

    //use derived state to sync with table state since we don't have access to dataManager
    //https://github.com/material-table-core/core/blob/master/src/components/MTableFilterRow/LookupFilter.js#L27
    useEffect(() => {
        setSelected(stringValToArray(filterValue));
    }, [filterValue]);

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

    function onFilterChange(event: React.ChangeEvent<{ value: unknown }>) {
        setSelected(event.target.value as number[]);
    }

    function onClose() {
        const rowId = (props.columnDef as any).tableData.id;
        // there seem to be internal timing issues with these filters, especially w/ rapid changes. setTimeout seems to help, but it's not perfect
        setTimeout(() => props.onFilterChanged(rowId, selected.join(",")));
    }

    return (
        <FormControl style={{ width: "100%" }}>
            {pipelinesObj && pipelineList && (
                <Select
                    multiple
                    value={selected}
                    onChange={onFilterChange}
                    onClose={onClose}
                    renderValue={items =>
                        (items as number[]).map(id => pipelineName(pipelinesObj[id])).join(", ")
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
