import React, { useCallback } from "react";
import { Column, MaterialTableProps } from "@material-table/core";

/**
 * Handle updating a given material-table with localStorage-cached sort order (orderBy, orderDirection).
 *
 * Return a function for updating the cache when sort order changes, and one for setting the initial column sorting.
 */
export function useSortOrderCache<RowData extends object>(
    tableRef: React.MutableRefObject<any>,
    cacheKey: string
) {
    const handleOrderChange: MaterialTableProps<RowData>["onOrderChange"] = (
        orderBy,
        orderDirection
    ) => {
        // Save as "field,direction" instead of "id,direction"
        const field: string = (tableRef.current.dataManager.columns as any[]).find(
            c => c.tableData.id === orderBy
        )?.field;
        if (field) localStorage.setItem(cacheKey, [field, orderDirection].join(","));
    };

    const setInitialSorting = useCallback(
        (columns: Column<RowData>[]) => {
            const saved = localStorage.getItem(cacheKey);
            if (saved === null) {
                return;
            }
            const [field, direction] = saved.split(",");
            if (direction !== "asc" && direction !== "desc") {
                console.error(`${cacheKey} is invalid format`);
                localStorage.removeItem(cacheKey);
                return;
            }
            // override any default sorts with saved one
            columns.forEach(column => {
                if (column.defaultSort) column.defaultSort = undefined;
                if (column.field === field) column.defaultSort = direction;
            });
        },
        [cacheKey]
    );

    return { handleOrderChange, setInitialSorting };
}
