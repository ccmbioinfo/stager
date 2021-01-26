import { useMutation, useQueryClient } from "react-query";
import { Group } from "../../typings";
import { deleteFromCachedList } from "../utils";

async function deleteGroup(group_code: string) {
    const response = await fetch("/api/groups/" + group_code, {
        method: "DELETE",
        credentials: "same-origin",
    });
    if (response.ok) {
        return response.text();
    } else {
        throw response;
    }
}

/**
 * Return a mutation object for DELETE /api/groups/:id
 *
 * Used for deleting a group.
 */
export function useGroupsDelete() {
    const queryClient = useQueryClient();
    const mutation = useMutation<string, Response, string>(deleteGroup, {
        onSuccess: (text, group_code) => {
            queryClient.removeQueries(["groups", group_code.toLowerCase()]);
            deleteFromCachedList<Group>(
                "groups",
                queryClient,
                group_code.toLowerCase(),
                "group_code"
            );
        },
    });
    return mutation;
}
