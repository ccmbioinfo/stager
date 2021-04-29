import { useQuery } from "react-query";
import { Family } from "../typings";
import { basicFetch } from "./utils";

async function fetchFamilies(familyCodename?: string) {
    return await basicFetch("/api/families", { starts_with: familyCodename });
}

/**
 * Return result of GET /api/families.
 *
 * That is, return an array of all families.
 */
export function useFamiliesQuery(familyCodename?: string) {
    const result = useQuery<Family[], Response>(
        familyCodename ? ["families", familyCodename] : "families",
        () => fetchFamilies(familyCodename)
    );
    return result;
}
