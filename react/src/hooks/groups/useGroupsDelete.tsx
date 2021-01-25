import { useMutation, useQueryClient } from "react-query";
import { Group } from "../../typings";

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
            queryClient.removeQueries(["groups", group_code.toLowerCase()]);

            const existingGroups: Group[] | undefined = queryClient.getQueryData("groups");
            if (existingGroups !== undefined) {
                queryClient.setQueryData(
                    "groups",
                    existingGroups.filter(group => group.group_code !== group_code)
                );
            } else {
                queryClient.invalidateQueries("groups");
            }
        },
    });
    return mutation;
}
