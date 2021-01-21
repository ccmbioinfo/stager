import { useQuery } from "react-query";
import { Family } from "../typings";
import { basicFetch } from "./utils";

async function fetchFamilies() {
    return await basicFetch("/api/families");
}

/**
 * Return an array of all family objects.
 */
export function useFamilies() {
    const result = useQuery<Family[], Response>("families", fetchFamilies);
    if (result.isSuccess) return result.data;
    return [];
}
