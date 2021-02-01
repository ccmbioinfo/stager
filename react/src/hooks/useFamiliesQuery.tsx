import { useQuery } from "react-query";
import { Family } from "../typings";
import { basicFetch } from "./utils";

async function fetchFamilies() {
    return await basicFetch("/api/families");
}

/**
 * Return result of GET /api/families.
 *
 * That is, return an array of all families.
 */
export function useFamiliesQuery() {
    const result = useQuery<Family[], Response>("families", fetchFamilies);
    return result;
}
