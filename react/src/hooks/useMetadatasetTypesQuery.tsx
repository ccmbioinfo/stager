import { useQuery } from "react-query";
import { basicFetch } from "./utils";

/**
 * Return JSON result of GET /api/metadatasettypes, or undefined if the fetch is unsuccessful.
 */
export function useMetadatasetTypesQuery() {
    const result = useQuery<Record<string, string[]>, Response>(
        "metadatasettypes",
        async () => await basicFetch("/api/metadatasettypes"),
        { staleTime: Infinity } // never gets stale
    );
    return result;
}
