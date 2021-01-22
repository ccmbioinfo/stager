import { useMutation, useQueryClient } from "react-query";
import { Group } from "../../typings";

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
            queryClient.invalidateQueries("groups");
            // we know that this group is brand new so we can cache it
            queryClient.setQueryData(["groups", sentGroup.group_code.toLowerCase()], receivedGroup);

            const cachedGroups = queryClient.getQueryData<Group[]>("groups");
            if (cachedGroups !== undefined) {
                // destructuring to keep consistent with GET /api/groups format
                const { users, ...listableGroup } = receivedGroup;
                queryClient.setQueryData("groups", [...cachedGroups, listableGroup]);
            }
        },
    });
    return mutation;
}
