import { useMutation, useQueryClient } from "react-query";
import { User } from "../../typings";
import { changeFetch, deleteFromCachedList } from "../utils";

async function deleteUser(username: string) {
    return changeFetch("/api/users/" + username, "DELETE", null, {
        onSuccess: response => response.text(),
    });
}

/**
 * Return a mutation object for DELETE /api/users/:username.
 *
 * Used for deleting a user by username.
 */
export function useUsersDeleteMutation() {
    const queryClient = useQueryClient();
    const mutation = useMutation<string, Response, string>(deleteUser, {
        onSuccess: (text, username) => {
            queryClient.removeQueries(["users", username]);
            deleteFromCachedList<User>("users", queryClient, username, "username");
        },
    });
    return mutation;
}
