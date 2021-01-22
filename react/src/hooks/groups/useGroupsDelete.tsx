import { useMutation, useQueryClient } from "react-query";

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
        onSuccess: group_code => {
            queryClient.removeQueries(["groups", group_code]);
            queryClient.invalidateQueries("groups");
        },
    });
    return mutation;
}
