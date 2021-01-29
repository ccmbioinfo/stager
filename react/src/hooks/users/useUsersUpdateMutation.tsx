import { useMutation, useQueryClient } from "react-query";
import { User } from "../../typings";
import { changeFetch, updateInCachedList } from "../utils";

async function patchUser(newUser: Partial<User>) {
    return changeFetch("/api/users/" + newUser.username, "PATCH", newUser);
}

/**
 * Return a mutation object for PATCH /api/users/:username.
 *
 * Used for updating fields such as password, email and
 * activation status.
 */
export function useUsersUpdateMutation() {
    const queryClient = useQueryClient();
    const mutation = useMutation<User, Response, Partial<User>>(patchUser, {
        onSuccess: newUser => {
            queryClient.setQueryData(["users", newUser.username], newUser);
            updateInCachedList<User>("users", queryClient, newUser, "username");
        },
    });
    return mutation;
}
