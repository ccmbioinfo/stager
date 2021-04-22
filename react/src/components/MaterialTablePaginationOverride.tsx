import React from "react";
import { TablePagination, TablePaginationProps } from "@material-ui/core";

/**
 * This is a fix for custom-labelled MaterialTable page sizes.
 *  https://github.com/mbrn/material-table/issues/1685
 *
 * MaterialTable's props.options supports a default pageSize and a list of pageSizeOptions
 * that are used in the select dropdown to switch between sizes. When that code was originally
 * written, the underlying pagination component only supported numbers for pageSizeOptions,
 * so this requirement was hard-coded into material-table's typings and prop types:
 *  https://github.com/mbrn/material-table/blob/b7474ca0f5497f04ff3a3d50e709d86de7c639b0/types/index.d.ts#L334
 *  https://github.com/mbrn/material-table/blob/b7474ca0f5497f04ff3a3d50e709d86de7c639b0/src/prop-types.js#L340
 *
 * However, pageSizeOptions is directly passed as the rowsPerPageOptions prop to the
 * underlying pagination component, which is overridable by the components.Pagination prop.
 *  https://github.com/mbrn/material-table/blob/b7474ca0f5497f04ff3a3d50e709d86de7c639b0/src/material-table.js#L751-L768
 * By default, this is material-ui TablePagination. A year after pageSizeOptions was added to
 * material-table, material-ui added support for custom labels, and this change never propagated
 * to material-table's typings. This feature can be found in material-ui documentation.
 *  https://github.com/mui-org/material-ui/pull/17885
 *  https://material-ui.com/components/tables/#custom-pagination-options
 *
 * While we can forcibly pass the pageSizeOptions to MaterialTable with an any cast (and potentially
 * a prop types warning in the browser console), MaterialTable will still render the actual value
 * backing the label, which is problematic if the label is meant to represent all available rows
 * rather than a specific number. This is because MaterialTable overrides the default TablePagination
 * rendering through SelectProps in a rather uncustomizable way.
 *  https://github.com/mbrn/material-table/blob/b7474ca0f5497f04ff3a3d50e709d86de7c639b0/src/material-table.js#L769-L775
 *
 * Therefore, we create this override component to pass as components.Pagination to MaterialTable,
 * such that the SelectProps provided by MaterialTable are ignored and the default TablePagination
 * behaviour is restored, which renders the user-provided label in rowsPerPageOptions.
 */
export default function MaterialTablePaginationOverride(props: TablePaginationProps) {
    return <TablePagination {...props} SelectProps={undefined} />;
}
