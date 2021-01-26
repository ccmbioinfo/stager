// Function patterns that commonly occur in this set of hooks.

import { MutationKey, QueryClient } from "react-query";

interface FetchOptions {
    onSuccess?: (res: Response) => any;
    onError?: (res: Response) => any;
}

/**
 * Fetch the provided url. Return the JSON response if successful.
 * Throw the response if unsuccessful.
 */
export async function basicFetch(url: string, options?: FetchOptions) {
    const response = await fetch(url);
    if (response.ok) {
        return response.json();
    } else {
        throw response;
    }
}

/**
 * Fetch the provided url with the given method and body (optional).
 * Return the JSON response if successful.
 * Throw the response if unsuccessful.
 */
export async function changeFetch(
    url: string,
    method: "POST" | "PATCH" | "DELETE",
    body?: any,
    options?: FetchOptions
) {
    const response = await fetch(url, {
        method: method,
        credentials: "same-origin",
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
    });
    if (response.ok) {
        if (options?.onSuccess) return options.onSuccess(response);
        return response.json();
    } else {
        if (options?.onError) return options.onError(response);
        throw response;
    }
}

/**
 * Helper function for updating a cached list after adding to, updating in, or removing
 * from said list.
 */
function updateCachedList<T>(
    queryKey: MutationKey,
    queryClient: QueryClient,
    updater: (existingData: T[]) => T[]
) {
    const existingData = queryClient.getQueryData<T[]>(queryKey);
    if (existingData !== undefined) {
        queryClient.setQueryData(queryKey, updater(existingData));
    } else {
        queryClient.invalidateQueries(queryKey);
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
    identifier: keyof T
) {
    updateCachedList<T>(queryKey, queryClient, existingData =>
        existingData.filter(data => data[identifier] !== deletedId)
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
    identifier: keyof T
) {
    updateCachedList<T>(queryKey, queryClient, existingData =>
        existingData.map(data => (data[identifier] === updated[identifier] ? updated : data))
    );
}

/**
 * Add a new entry to a cached list.
 */
export function addToCachedList<T>(queryKey: MutationKey, queryClient: QueryClient, added: T) {
    updateCachedList<T>(queryKey, queryClient, existingData => [...existingData, added]);
}
