import React, { createContext, useContext, useEffect, useState } from "react";

type ClientContextType = (url: string) => void;

const ClientContext = createContext<ClientContextType>(() => {});
const ResultContext = createContext<any>({});

/**
 * Provider for useFetchCache hook.
 */
export default function FetchCacheProvider(props: { children: React.ReactNode }) {
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

/**
 * Given an API url, caches and returns the result of
 * that API call. Cached result expires when the session ends.
 */
export function useFetchCache(url: string) {
    useContext(ClientContext)(url);
    return useContext(ResultContext);
}
