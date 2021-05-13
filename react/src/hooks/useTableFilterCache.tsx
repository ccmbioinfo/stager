import { Column, Filter } from "@material-table/core";

/**
 * Return functions for handling table filter caching.
 *
 * Instead of loading saved filters on mount via side effect,
 * use `setInitialFilters` to set the default filter values
 * for all columns before providing them to material-table as a prop.
 */
export function useTableFilterCache<RowData extends object>(cacheKey: string) {
    /**
     * Update the stored filters for this table.
     * Filters should be extracted from material-table query
     * when data is fetched.
     */
    const handleFilterChange = (filters: Filter<RowData>[]) => {
        localStorage.setItem(cacheKey, JSON.stringify(filters));
    };

    /**
     * Sets default filter values for an array of columns
     * using saved localStorage filters, if possible.
     */
    const setInitialFilters = (columns: Column<RowData>[]) => {
        const filterCache = localStorage.getItem(cacheKey);
        if (filterCache !== null) {
            const parsedCache = JSON.parse(filterCache);
            if (!Array.isArray(parsedCache)) {
                console.error(`${cacheKey} has invalid format`);
                localStorage.removeItem(cacheKey);
                return;
            }
            const filterMapping = new Map(
                (parsedCache as Filter<RowData>[]).map(f => [f.column?.field, f.value])
            );

            columns.forEach(col => {
                const filter = filterMapping.get(col.field);
                if (filter !== undefined) col.defaultFilter = filter;
            });
        }
    };

    return {
        handleFilterChange,
        setInitialFilters,
    };
}
