import { useQuery } from "react-query";
import { basicFetch } from "./utils";

async function fetchInstitutions() {
    return await basicFetch("/api/institutions");
}

/**
 * Return query object for GET /api/institutions
 */
export function useInstitutionsQuery() {
    const result = useQuery<string[], Response>("institutions", fetchInstitutions, {
        staleTime: Infinity,
    });
    return result;
}
