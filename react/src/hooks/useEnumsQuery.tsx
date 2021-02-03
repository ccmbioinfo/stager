import { useQuery } from "react-query";
import { basicFetch } from "./utils";

// What we expect /api/enums to give us
type EnumResult = { [key: string]: string[] };

async function fetchEnums() {
    return await basicFetch("/api/enums");
}

/**
 * Returns a query object for GET /api/enums.
 * The data property is undefined if the fetch is unsuccessful.
 */
export function useEnumsQuery() {
    const result = useQuery<EnumResult, Response>("enums", fetchEnums, {
        staleTime: Infinity, // for now, it never gets stale
    });
    return result;
}
