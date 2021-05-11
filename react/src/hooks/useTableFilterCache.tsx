import React, { useCallback, useLayoutEffect, useState } from "react";
import { Filter, MaterialTableProps } from "@material-table/core";
import { setTableFilters } from "../functions";

export function useTableFilterCache<RowData extends object>(
    tableRef: React.MutableRefObject<any>,
    cacheKey: string,
    dependencies?: (boolean | undefined)[]
) {
    const [applied, setApplied] = useState(false);

    const handleFilterChanged: MaterialTableProps<RowData>["onFilterChange"] = useCallback(
        filters => {
            // const filterCache: string[] = [];
            // filters.forEach(filter => {
            //     filterCache.push(`${filter.column.field};${filter.value}`);
            // });
            localStorage.setItem(cacheKey, JSON.stringify(filters));
        },
        [cacheKey]
    );

    useLayoutEffect(() => {
        if (tableRef.current && !applied) {
            // Get stored settings
            const filterCache = localStorage.getItem(cacheKey);
            if (filterCache === null) {
                // not found
                // is this legal?
                handleFilterChanged(tableRef.current.state.query.filters);
            } else {
                // found
                // const filters = filterCache.split(",");
                // integrity check
                // if (!filters.every(f => f.split(";").length === 2)) {
                //     console.error(`${cacheKey} has invalid format`);
                //     localStorage.removeItem(cacheKey);
                // } else {
                //     const filterMapping = filters.map(f => f.split(";"));
                //     filterMapping.forEach();
                //     setTableFilters<object>(tableRef, new Map(filters.map(f => f.split(";"))));
                // }

                console.log("setting filters...");
                const filters: Filter<RowData>[] = JSON.parse(filterCache);

                setTableFilters<RowData>(
                    tableRef,
                    new Map(filters.map(f => [f.column.field as keyof RowData, f.value]))
                );
            }

            setApplied(true);
        }
    }, [tableRef, cacheKey, dependencies, handleFilterChanged, applied]);

    return handleFilterChanged;
}
