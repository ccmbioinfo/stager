import { useMutation, useQueryClient } from "react-query";
import { Group } from "../../typings";
import { addToCachedList, changeFetch } from "../utils";

async function postNewGroup(newGroup: Group) {
    return changeFetch("/api/groups", "POST", {
        ...newGroup,
        group_code: newGroup.group_code.toLowerCase(),
    });
}

/**
 * Return a mutation object for POST /api/groups.
 *
 * Used for creating a new group.
 */
export function useGroupCreateMutation() {
    const queryClient = useQueryClient();
    const mutation = useMutation<Group, Response, Group>(postNewGroup, {
        onSuccess: (receivedGroup, sentGroup) => {
            queryClient.setQueryData(["groups", sentGroup.group_code.toLowerCase()], receivedGroup);
            // destructuring to keep consistent with GET /api/groups format
            const { users, ...listableGroup } = receivedGroup;
            addToCachedList<Group>("groups", queryClient, listableGroup, {
                invalidateQueryFilters: {
                    exact: true,
                },
            });
        },
    });
    return mutation;
}
