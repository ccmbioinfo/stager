import { useQuery, UseQueryOptions } from "react-query";
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
export function useGroupsQuery(options: UseQueryOptions<Group[], Response> = {}) {
    // all groups
    const result = useQuery<Group[], Response>("groups", fetchGroups, { ...options });
    return result;
}
