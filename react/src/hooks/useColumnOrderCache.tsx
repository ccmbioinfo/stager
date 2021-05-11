import React, { useEffect, useState } from "react";
import { MaterialTableProps } from "@material-table/core";
import { getTableColumnOrder } from "../functions";

/**
 * Handle updating a given material-table with localStorage-cached column order.
 *
 * If any dependencies are specified, ensure that they are all true before
 * loading column order from cache. Dependencies include any other state variables
 * or queries that must be completed for the table to render properly on first try.
 *
 * Return a function for updating the cache on column drag.
 */
export function useColumnOrderCache(
    tableRef: React.MutableRefObject<any>,
    cacheKey: string,
    dependencies?: (boolean | undefined)[]
) {
    // ensures that the side effect only occurs once
    const [applied, setApplied] = useState(false);

    const handleOrderChange: MaterialTableProps<object>["onColumnDragged"] = () => {
        // source and dest are just the visible indexes
        // not the true indexes that take hidden columns into account
        // so we just dig the the new column orders out of the table's data manager
        const columnOrderRecord = getTableColumnOrder(tableRef);
        if (columnOrderRecord !== null) {
            localStorage.setItem(cacheKey, JSON.stringify(columnOrderRecord));
        } else {
            console.error(`Failed to cache column order for ${cacheKey}.`);
        }
    };

    useEffect(() => {
        if (tableRef.current && (!dependencies || dependencies.every(dep => !!dep)) && !applied) {
            // Get stored settings
            const columnOrderCache = localStorage.getItem(cacheKey);
            // maps id -> columnIndex
            let columnOrderRecord: Record<string, number> = {};
            if (columnOrderCache === null) {
                // Cache is empty, use table columns and update cache
                const temp = getTableColumnOrder(tableRef);
                if (temp === null) {
                    console.error("Failed to get table column order.");
                } else {
                    columnOrderRecord = temp;
                    localStorage.setItem(cacheKey, JSON.stringify(columnOrderRecord));
                }
            } else {
                // Cache is non-empty
                columnOrderRecord = JSON.parse(columnOrderCache);
                // TODO: verify the format and integrity of the result from localStorage
                try {
                    // Update the table
                    (tableRef.current.dataManager.columns as any[]).forEach(col => {
                        col.tableData.columnOrder = columnOrderRecord[`${col.tableData.id}`];
                    });
                } catch (error) {
                    // Bad cache
                    console.error(error);
                    localStorage.removeItem(cacheKey);
                }
            }
            setApplied(true);
        }
    }, [tableRef, cacheKey, dependencies, applied]);

    return handleOrderChange;
}
