import React, { useEffect, useState } from "react";
import { ClientContext, ResultContext } from "./FetchCacheContext";

/**
 * Provider for useFetchCache hook.
 */
export function FetchCacheProvider(props: { children: React.ReactNode }) {
    const [url, setURL] = useState("");
    const [cache, setCache] = useState<{ [url: string]: any }>({});

    // Problem: If you ask for resource B when you already asked for resource A,
    // the hook gives resource A back for a split-second while resource B gets
    // fetched.
    useEffect(() => {
        function updateCache(key: string, value: any) {
            setCache(oldCache => {
                const newCache = { ...oldCache };
                newCache[key] = value;
                return newCache;
            });
        }

        // use url as cache key
        const stored = sessionStorage.getItem(url);
        if (stored) {
            // hit, no fetch
            updateCache(url, JSON.parse(stored));
        } else {
            // miss, refetch
            fetch(url).then(async response => {
                if (response.ok) {
                    const data = await response.json();
                    sessionStorage.setItem(url, JSON.stringify(data));
                    updateCache(url, data);
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
            <ResultContext.Provider value={cache}>{props.children}</ResultContext.Provider>
        </ClientContext.Provider>
    );
}
