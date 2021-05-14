import { Column, MaterialTableProps } from "@material-table/core";

export function useHiddenColumnCache<RowData extends object>(cacheKey: string) {
    type HiddenColumnMap = Map<Column<RowData>["field"], boolean>;

    function loadMap(cacheKey: string): HiddenColumnMap | null {
        const stored = localStorage.getItem(cacheKey);
        if (stored === null) return null;
        try {
            const map: HiddenColumnMap = new Map(JSON.parse(stored));
            return map;
        } catch (error) {
            console.error(cacheKey, error);
            localStorage.removeItem(cacheKey);
            return null;
        }
    }

    function saveMap(cacheKey: string, map: HiddenColumnMap) {
        const arrayForm = Array.from(map.entries());
        localStorage.setItem(cacheKey, JSON.stringify(arrayForm));
    }

    // Add the provided column hidden status to localStorage
    const handleChangeColumnHidden: MaterialTableProps<RowData>["onChangeColumnHidden"] = (
        column,
        hidden
    ) => {
        let mapping = loadMap(cacheKey);

        if (mapping === null) {
            mapping = new Map();
        }
        if (column.field) mapping.set(column.field, hidden);
        saveMap(cacheKey, mapping);
    };

    // Update columns with stored hidden statuses
    const setHiddenColumns = (columns: Column<RowData>[]) => {
        const mapping = loadMap(cacheKey);
        if (mapping === null) return;
        columns.forEach(col => {
            const hidden = mapping.get(col.field);
            if (typeof hidden === "boolean" || hidden === undefined)
                col.hidden = mapping.get(col.field);
        });
    };

    return {
        handleChangeColumnHidden,
        setHiddenColumns,
    };
}
