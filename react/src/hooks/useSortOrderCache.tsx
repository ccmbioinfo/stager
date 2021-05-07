import React, { useEffect, useState } from "react";
import { MaterialTableProps } from "@material-table/core";

/**
 * Handle updating a given material-table with localStorage-cached sort order (orderBy, orderDirection).
 *
 * If any dependencies are specified, ensure that they are all true before
 * loading sort order from cache. Dependencies include any other state variables
 * or queries that must be completed for the table to render properly on first try.
 *
 * Return a function for updating the cache when sort order changes.
 */
export function useSortOrderCache(
    tableRef: React.MutableRefObject<any>,
    cacheKey: string,
    dependencies?: boolean[]
) {
    const [applied, setApplied] = useState(false);

    const handleSortChange: MaterialTableProps<object>["onOrderChange"] = (
        orderBy,
        orderDirection
    ) => {
        localStorage.setItem(cacheKey, [orderBy, orderDirection].join(","));
    };

    useEffect(() => {
        if (
            tableRef.current &&
            (dependencies === undefined || dependencies.find(dep => !dep) === undefined) &&
            !applied
        ) {
            const sortOrderCache = localStorage.getItem(cacheKey);
            if (sortOrderCache === null) {
                // empty cache
                localStorage.setItem(
                    cacheKey,
                    [
                        tableRef.current.dataManager.orderBy,
                        tableRef.current.dataManager.orderDirection,
                    ].join(",")
                );
            } else {
                // cache hit
                try {
                    // simple format check
                    const cachedArray = sortOrderCache.split(",");
                    if (cachedArray.length !== 2) throw Error(`${cacheKey} is not array of size 2`);
                    const orderBy = parseInt(cachedArray[0]);
                    const orderDirection = cachedArray[1];

                    tableRef.current.onChangeOrder(orderBy, orderDirection);
                    // tableRef.current.dataManager.sortData();
                    console.log(
                        tableRef.current.dataManager.orderBy,
                        tableRef.current.dataManager.orderDirection
                    );
                    // tableRef.current.onQueryChange();
                } catch (error) {
                    // bad cache
                    console.error(error);
                    localStorage.removeItem(cacheKey);
                }
            }
            setApplied(true);
        }
    }, [tableRef, cacheKey, dependencies, applied]);

    return handleSortChange;
}
