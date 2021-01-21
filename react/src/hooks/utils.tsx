// Function patterns that commonly occur in this set of hooks.

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
