import { useQuery } from "react-query";
import { basicFetch } from "./utils";

// What we expect /api/enums to give us
type EnumResult = { [key: string]: string[] };

async function fetchEnums() {
    return await basicFetch("/api/enums");
}

/**
 * Return json result of GET /api/enums.
 * Return undefined if fetch is unsuccessful.
 */
export function useEnums() {
    const result = useQuery<EnumResult, Response>("enums", fetchEnums, {
        staleTime: Infinity, // for now, it never gets stale
    });
    if (result.isSuccess) return result.data;
    return undefined;
}
