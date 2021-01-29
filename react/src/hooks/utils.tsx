// Function patterns that commonly occur in this set of hooks.

import { Query, QueryResult } from "material-table";
import { stringToBoolean } from "../functions";

/**
 * Fetch the provided url. Return the json response if successful.
 * Throw the response if unsuccessful.
 */
export async function basicFetch(url: string) {
    const response = await fetch(url);
    if (response.ok) {
        return response.json();
    } else {
        throw response;
    }
}

/**
 * Builds a data fetch request and returns a promise that resolves
 * to the result object.
 *
 * @param query Query parameter provided by m-table data prop
 * @param url The API url to request from (/api/example)
 */
export async function queryTableData<RowData extends object>(
    query: Query<RowData>,
    url: string
): Promise<QueryResult<RowData>> {
    const searchParams = new URLSearchParams();
    // add filters
    for (let filter of query.filters) {
        const isBoolean = ["affected", "solved"].includes("" + filter.column.field);
        let operator = "like";
        let value = filter.value;
        // booleans use "eq" as operator
        if (isBoolean) {
            operator = "eq";
            value = stringToBoolean(filter.value);
        }
        if (filter.value || isBoolean) {
            searchParams.append("filter", `${filter.column.field};${operator};${value}`);
        }
    }
    // order by
    if (query.orderBy && query.orderDirection) {
        searchParams.append("order_by", `${query.orderBy.field}`);
        searchParams.append("order_dir", `${query.orderDirection}`);
    }
    // page information
    searchParams.append("page", `${query.page + 1}`);
    searchParams.append("limit", `${query.pageSize}`);

    const response = await fetch(url + "?" + searchParams.toString());
    if (response.ok) {
        const result = await response.json();
        return {
            data: result.data,
            page: result.page - 1,
            totalCount: result.totalCount,
        };
    } else {
        throw response;
    }
}
