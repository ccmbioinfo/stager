import { useMutation, useQueryClient } from "react-query";
import { Group } from "../../typings";
import { changeFetch, deleteFromCachedList } from "../utils";

async function deleteGroup(group_code: string) {
    return await changeFetch<string, Response>("/api/groups/" + group_code, "DELETE", null, {
        onSuccess: response => response.text(),
    });
}

/**
 * Return a mutation object for DELETE /api/groups/:id
 *
 * Used for deleting a group.
 */
export function useGroupDeleteMutation() {
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
