import { useContext } from "react";
import { ClientContext, ResultContext } from "./FetchCacheContext";

/**
 * Hook that returns the JSON response from
 * GET-ing the provided url. Result is cached and
 * reused. Cache expires on session end.
 */
export function useFetchCache(url: string) {
    useContext(ClientContext)(url);
    const result = useContext(ResultContext);
    return result ? (result[url] ? result[url] : undefined) : undefined;
}
