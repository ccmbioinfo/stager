import { useQuery } from "react-query";
import { Family } from "../../typings";
import { basicFetch } from "../utils";

async function fetchFamilies(params: Record<string, any>) {
    return await basicFetch("/api/families", params);
}

/**
 * Return result of GET /api/families.
 *
 * That is, return an array of all families.
 */
export function useFamiliesQuery(familyCodename?: string) {
    const params = {
        starts_with: familyCodename,
    };

    const result = useQuery<Family[], Response>(
        familyCodename ? ["families", params] : "families",
        () => fetchFamilies(params)
    );
    return result;
}
