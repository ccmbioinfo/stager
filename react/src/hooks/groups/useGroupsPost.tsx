import { useMutation, useQueryClient } from "react-query";
import { Group } from "../../typings";
import { addToCachedList } from "../utils";

async function postNewGroup(newGroup: Group) {
    const response = await fetch("/api/groups", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newGroup, group_code: newGroup.group_code.toLowerCase() }),
    });
    if (response.ok) {
        return response.json();
    } else {
        throw response;
    }
}

/**
 * Return a mutation object for POST /api/groups.
 *
 * Used for creating a new group.
 */
export function useGroupsPost() {
    const queryClient = useQueryClient();
    const mutation = useMutation<Group, Response, Group>(postNewGroup, {
        onSuccess: (receivedGroup, sentGroup) => {
            queryClient.setQueryData(["groups", sentGroup.group_code.toLowerCase()], receivedGroup);
            // destructuring to keep consistent with GET /api/groups format
            const { users, ...listableGroup } = receivedGroup;
            addToCachedList<Group>("groups", queryClient, listableGroup);
        },
    });
    return mutation;
}
