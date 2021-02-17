import { useMutation, useQueryClient } from "react-query";
import { useUserContext } from "../../contexts";
import { User } from "../../typings";
import { changeFetch, updateInCachedList } from "../utils";

async function patchUser(newUser: Partial<User>) {
    return changeFetch("/api/users/" + newUser.username, "PATCH", newUser);
}

/**
 * Return a mutation object for PATCH /api/users/:username.
 *
 * Used for updating fields such as password, email, groups,
 * and activation status.
 */
export function useUsersUpdateMutation() {
    const queryClient = useQueryClient();
    const userClient = useUserContext();
    const mutation = useMutation<User, Response, Partial<User>>(patchUser, {
        onSuccess: newUser => {
            queryClient.setQueryData(["users", newUser.username], newUser);
            updateInCachedList<User>("users", queryClient, newUser, "username");
            if (newUser.username === userClient.user.username) {
                userClient.updateUser({ groups: newUser.groups });
            }
        },
    });
    return mutation;
}
