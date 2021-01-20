import { useQuery } from "react-query";

// What we expect /api/enums to give us
type EnumResult = { [key: string]: string[] };

async function fetchEnums() {
    const response = await fetch("/api/enums");
    if (response.ok) {
        return response.json();
    } else {
        throw new Error(`${response.status} - ${response.statusText}`);
    }
}

/**
 * Return json result of GET /api/enums.
 * Return undefined if fetch is unsuccessful.
 */
export function useEnums() {
    const result = useQuery<EnumResult, Error>("enums", fetchEnums, {
        staleTime: Infinity, // for now, it never gets stale
    });
    if (result.isSuccess) return result.data;
    return undefined;
}
