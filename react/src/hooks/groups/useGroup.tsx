import { useQuery } from "react-query";
import { Group } from "../../typings";
import { basicFetch } from "../utils";

async function fetchGroup(group_code: string) {
    return await basicFetch("/api/groups/" + group_code.toLowerCase());
}

/**
 * Return result of GET /api/groups/:id.
 *
 * That is, return the specified group object which includes
 * the list of users who belong to it.
 */
export function useGroup(group_code: string) {
    const result = useQuery<Group, Response>(["groups", group_code.toLowerCase()], () =>
        fetchGroup(group_code)
    );
    if (result.isSuccess) return result.data;
    return undefined;
}
