// Function patterns that commonly occur in this set of hooks.

import { Query, QueryResult } from "material-table";
import { stringToBoolean } from "../functions";
import {
    MutationKey,
    QueryClient,
    useQueries,
    UseQueryOptions,
    UseQueryResult,
    InvalidateOptions,
    InvalidateQueryFilters,
} from "react-query";
import { SetDataOptions } from "react-query/types/core/query";

/**
 * Fetch the provided url. Return the JSON response if successful.
 * Throw the response if unsuccessful.
 */
export async function basicFetch(
    url: string,
    params: Record<string, any> = {},
    options: RequestInit | undefined = undefined
) {
    const paramString = Object.keys(params).length ? `?${new URLSearchParams(params)}` : "";
    const response = await fetch(`${url}${paramString}`, options);
    if (response.ok) {
        if (response.headers.get("Content-Type") === "text/csv") {
            return response.text();
        } else return response.json();
    } else {
        throw response;
    }
}

/**
 * Fetch csv from provided url. Download csv if successful.
 * Throw the response if unsuccessful.
 */
export async function fetchAndDownloadCsv(
    url: string,
    params: Record<string, any> = {},
    options: RequestInit | undefined = {}
) {
    let headers = { Accept: "text/csv" };
    if (options.headers) {
        headers = { ...options.headers, ...headers };
    }
    const paramString = Object.keys(params).length ? `?${new URLSearchParams(params)}` : "";

    const response = await fetch(`${url}${paramString}`, { ...options, headers });

    if (response.ok) {
        const csvBlob = await response.blob();
        const downloadLink = document.createElement("a");
        const filename = (
            response.headers.get("content-disposition") || "filename=report.csv"
        ).replace(/.+=/, "");
        const url = URL.createObjectURL(csvBlob);
        downloadLink.href = url;
        downloadLink.download = filename;
        downloadLink.click();
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
        let value = filter.value;
        // booleans use "eq" as operator
        if (isBoolean) {
            value = stringToBoolean(filter.value);
        }
        if (filter.column.field && (filter.value || isBoolean)) {
            searchParams.append(`${filter.column.field}`, `${value}`);
        }
    }
    // order by
    if (query.orderBy && query.orderDirection) {
        searchParams.append("order_by", `${query.orderBy.field}`);
        searchParams.append("order_dir", `${query.orderDirection}`);
    }
    // page information
    searchParams.append("page", `${query.page}`);
    searchParams.append("limit", `${query.pageSize}`);

    const response = await fetch(url + "?" + searchParams.toString());
    if (response.ok) {
        const result = await response.json();
        return {
            data: result.data,
            page: result.page,
            totalCount: result.total_count,
        };
    } else {
        throw response;
    }
}

/**
 * Fetch the provided url with the given method and body (optional).
 * Return the JSON response if successful.
 * Throw the response if unsuccessful.
 */
export async function changeFetch<
    TSuccess extends unknown | Promise<any>,
    TError extends unknown | Response
>(
    url: string,
    method: "POST" | "PATCH" | "DELETE",
    body?: any,
    overrides?: {
        onSuccess?: (res: Response) => Promise<TSuccess>;
        onError?: (res: Response) => Promise<TError>;
    }
) {
    const response = await fetch(url, {
        method: method,
        credentials: "same-origin",
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
    });
    if (response.ok) {
        if (overrides?.onSuccess) return await overrides.onSuccess(response);
        return response.json();
    } else {
        if (overrides?.onError) throw await overrides.onError(response);
        throw response;
    }
}

interface UpdateCacheOptions {
    invalidateQueryFilters?: InvalidateQueryFilters;
    invalidateOptions?: InvalidateOptions;
    setQueryData?: SetDataOptions;
}

/**
 * Helper function for updating a cached list after adding to, updating in, or removing
 * from said list.
 */
function updateCachedList<T>(
    queryKey: MutationKey,
    queryClient: QueryClient,
    updater: (existingData: T[]) => T[],
    options?: UpdateCacheOptions
) {
    const existingData = queryClient.getQueryData<T[]>(queryKey);
    if (existingData !== undefined) {
        queryClient.setQueryData(queryKey, updater(existingData), options?.setQueryData);
    } else {
        queryClient.invalidateQueries(
            queryKey,
            options?.invalidateQueryFilters,
            options?.invalidateOptions
        );
    }
}

/**
 * Update a cached list after deleting an entry from it.
 *
 * @param deletedId The property to compare to entries in the list.
 * @param identifier The key used to compare entries in the list with deletedId.
 */
export function deleteFromCachedList<T>(
    queryKey: MutationKey,
    queryClient: QueryClient,
    deletedId: T[keyof T],
    identifier: keyof T,
    options?: UpdateCacheOptions
) {
    updateCachedList<T>(
        queryKey,
        queryClient,
        existingData => existingData.filter(data => data[identifier] !== deletedId),
        options
    );
}

/**
 * Update a cached list after updating an entry in it.
 *
 * @param identifier The key used to uniquely identify entries in the list.
 */
export function updateInCachedList<T>(
    queryKey: MutationKey,
    queryClient: QueryClient,
    updated: T,
    identifier: keyof T,
    options?: UpdateCacheOptions
) {
    updateCachedList<T>(
        queryKey,
        queryClient,
        existingData =>
            existingData.map(data => (data[identifier] === updated[identifier] ? updated : data)),
        options
    );
}

/**
 * Add a new entry to a cached list.
 */
export function addToCachedList<T>(
    queryKey: MutationKey,
    queryClient: QueryClient,
    added: T,
    options?: UpdateCacheOptions
) {
    updateCachedList<T>(queryKey, queryClient, existingData => [...existingData, added], options);
}

// useQueries doesn't have proper typing yet, so we have this wrapper
// see: https://github.com/tannerlinsley/react-query/issues/1675#issuecomment-767323572

type Awaited<T> = T extends PromiseLike<infer U> ? Awaited<U> : T;

export function useQueriesTyped<TQueries extends readonly UseQueryOptions[]>(
    queries: [...TQueries]
): {
    [ArrayElement in keyof TQueries]: UseQueryResult<
        TQueries[ArrayElement] extends { select: infer TSelect }
            ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
              TSelect extends (data: any) => any
                ? ReturnType<TSelect>
                : never
            : Awaited<
                  ReturnType<
                      NonNullable<Extract<TQueries[ArrayElement], UseQueryOptions>["queryFn"]>
                  >
              >
    >;
} {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return useQueries(queries as UseQueryOptions<unknown, unknown, unknown>[]) as any;
}

/**
 * Remove all queries from cache, with optional preservation whitelist
 * @param queryClient The react-query client.
 * @param preserve Optional array of string keys to preserve
 */
export function clearQueryCache(queryClient: QueryClient, preserve: string[] = []): void {
    return queryClient
        .getQueryCache()
        .getAll()
        .forEach(query => {
            const key = Array.isArray(query.queryKey)
                ? (query.queryKey[0] as string)
                : (query.queryKey as string);
            if (!preserve.includes(key)) {
                queryClient.removeQueries(key);
            }
        });
}
