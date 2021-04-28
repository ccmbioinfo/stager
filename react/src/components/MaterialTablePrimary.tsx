import MaterialTable, { MaterialTableProps } from "material-table";
import MaterialTablePaginationOverride from "./MaterialTablePaginationOverride";

/**
 * Some props are shared between our three primary tables for a consistent interface.
 *
 * This component sets some defaults, even for props that are themselves objects
 * (though not recursively), and supports overriding the defaults.
 *
 * e.g. components.Pagination can still be overridden, but passing a components prop
 * will not override this default by itself
 * e.g. additional options can be provided, but options.pageSizeOptions and
 * options.exportButton will be replaced in their entirety if provided
 * e.g. additional localization can be provided, but providing any localization.header
 * will entirely override that subobject
 */
export default function MaterialTablePrimary<T extends object>(props: MaterialTableProps<T>) {
    return (
        <MaterialTable
            {...props}
            components={{
                Pagination: MaterialTablePaginationOverride,
                ...props.components,
            }}
            options={{
                columnsButton: true,
                pageSize: 20,
                pageSizeOptions: [
                    20,
                    50,
                    100,
                    // 0 or -1 cannot be used as MaterialTable still uses this value for rendering rows
                    // instead of the size of data fetched from the server, which leads to weird effects.
                    // This value is only safe with emptyRowsWhenPaging: false, or MaterialTable
                    // will try to render a near-infinite number of empty rows.
                    { value: Number.MAX_SAFE_INTEGER, label: "All" } as any,
                ], // see MaterialTablePaginationOverride regarding the cast
                emptyRowsWhenPaging: false,
                filtering: true,
                search: false,
                padding: "dense",
                exportAllData: true,
                exportButton: { csv: true, pdf: false },
                ...props.options,
            }}
            localization={{
                header: {
                    actions: "", // remove action buttons' header
                },
                ...props.localization,
            }}
        />
    );
}
