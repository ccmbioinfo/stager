import { useMutation, useQueryClient } from "react-query";
import { Group } from "../../typings";
import { updateInCachedList, changeFetch } from "../utils";

async function patchGroup(newGroup: Group) {
    // group_code is immutable
    const { group_code, ...group } = newGroup;
    return changeFetch("/api/groups/" + group_code, "PATCH", group);
}

/**
 * Return a mutation object for PATCH /api/groups/:id.
 *
 * Used for updating fields for an existing group.
 */
export function useGroupsUpdateMutation() {
    const queryClient = useQueryClient();
    const mutation = useMutation<Group, Response, Group>(patchGroup, {
        onSuccess: updatedGroup => {
            // successfully patched, so we can update cache immediately
            queryClient.setQueryData(
                ["groups", updatedGroup.group_code.toLowerCase()],
                updatedGroup
            );
            updateInCachedList<Group>("groups", queryClient, updatedGroup, "group_code");
        },
    });
    return mutation;
}
