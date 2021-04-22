import MaterialTable, { MaterialTableProps } from "material-table";
import MaterialTablePaginationOverride from "./MaterialTablePaginationOverride";

/**
 * Some props are shared between our three primary tables for a consistent interface.
 *
 * This appropriate supports setting defaults, even for props that are themselves objects
 * (though not recursively), while still being able to override the defaults.
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
                pageSize: 20,
                pageSizeOptions: [20, 50, 100, { value: -1, label: "All" } as any], // see MaterialTablePaginationOverride
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
