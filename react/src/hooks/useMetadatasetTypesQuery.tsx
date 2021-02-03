import { useQuery } from "react-query";
import { basicFetch } from "./utils";

/**
 * Returns a query object for GET /api/metadatasettypes.
 * The data property is undefined if the fetch is unsuccessful.
 */
export function useMetadatasetTypesQuery() {
    const result = useQuery<Record<string, string[]>, Response>(
        "metadatasettypes",
        async () => await basicFetch("/api/metadatasettypes"),
        { staleTime: Infinity } // never gets stale
    );
    return result;
}
