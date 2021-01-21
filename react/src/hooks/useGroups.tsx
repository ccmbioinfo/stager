import { useQuery } from "react-query";
import { Group } from "../typings";
import { basicFetch } from "./utils";

async function fetchGroups() {
    return await basicFetch("/api/groups");
}

/**
 * Return all permission groups.
 */
export function useGroups(): Group[] {
    // all groups
    const result = useQuery<Group[], Error>("groups", fetchGroups, {
        staleTime: 1000 * 60, // 1 minute
    });
    if (result.isSuccess) return result.data;
    return [];
}
