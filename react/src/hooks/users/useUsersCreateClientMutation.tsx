import { useMutation, useQueryClient } from "react-query";
import { useUserContext } from "../../contexts";
import { User } from "../../typings";
import { changeFetch, updateInCachedList } from "../utils";

async function postNewClient(user: User) {
    return changeFetch(`/api/users/${user.username}/client`, "POST", {});
}

/**
 * Return a mutation object for creating a new oauth client for the user.
 *
 */
export function useUsersCreateClientMutation() {
    const queryClient = useQueryClient();
    const userClient = useUserContext();
    const mutation = useMutation<User, Response, User>(postNewClient, {
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
