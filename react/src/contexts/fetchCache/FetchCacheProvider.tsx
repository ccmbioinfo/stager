import React, { useEffect, useState } from "react";
import { ClientContext, ResultContext } from "./FetchCacheContext";

/**
 * Provider for useFetchCache hook.
 */
export function FetchCacheProvider(props: { children: React.ReactNode }) {
    const [url, setURL] = useState("");
    const [cachedResult, setCachedResult] = useState<any>();

    useEffect(() => {
        // use url as cache key
        const stored = sessionStorage.getItem(url);
        if (stored) {
            // hit, no fetch
            setCachedResult(JSON.parse(stored));
        } else {
            // miss, refetch
            fetch(url).then(async response => {
                if (response.ok) {
                    const data = await response.json();
                    sessionStorage.setItem(url, JSON.stringify(data));
                    setCachedResult(data);
                } else {
                    console.error(
                        `GET ${url} failed with response ${response.status} - ${response.statusText}`
                    );
                }
            });
        }
    }, [url]);

    // Nested providers so that we can pass in URL via ClientContext,
    // and retrieve result via ResultContext
    return (
        <ClientContext.Provider value={setURL}>
            <ResultContext.Provider value={cachedResult}>{props.children}</ResultContext.Provider>
        </ClientContext.Provider>
    );
}
