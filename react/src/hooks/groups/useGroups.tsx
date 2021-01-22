import { useQuery } from "react-query";
import { Group } from "../../typings";
import { basicFetch } from "../utils";

async function fetchGroups() {
    return await basicFetch("/api/groups");
}

/**
 * Return result of GET /api/groups.
 *
 * That is, return an array of all permission groups as name-code pairs.
 */
export function useGroups(): Group[] {
    // all groups
    const result = useQuery<Group[], Response>("groups", fetchGroups, {
        staleTime: 1000 * 60, // 1 minute
    });
    if (result.isSuccess) return result.data;
    return [];
}
