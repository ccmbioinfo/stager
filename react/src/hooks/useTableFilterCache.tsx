import { Column, Filter } from "@material-table/core";

export function useTableFilterCache<RowData extends object>(cacheKey: string) {
    const handleFilterChanged = (filters: Filter<RowData>[]) =>
        localStorage.setItem(cacheKey, JSON.stringify(filters));

    const setInitialFilters = (columns: Column<RowData>[]) => {
        const filterCache = localStorage.getItem(cacheKey);
        if (filterCache !== null) {
            const filterMapping = new Map(
                (JSON.parse(filterCache) as Filter<RowData>[]).map(f => [f.column.field, f.value])
            );

            columns.forEach(col => {
                const filter = filterMapping.get(col.field);
                if (filter !== undefined) col.defaultFilter = filter;
            });
        }
    };

    return {
        handleFilterChanged: handleFilterChanged,
        setInitialFilters: setInitialFilters,
    };
}
