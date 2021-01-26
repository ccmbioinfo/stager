import { useMutation, useQueryClient } from "react-query";
import { User } from "../../typings";
import { addToCachedList, changeFetch } from "../utils";

async function createUser(newUser: User) {
    return changeFetch("/api/users/" + newUser.username, "POST", newUser);
}

/**
 * Return a mutation object for POST /api/users/:username.
 *
 * Used for creating a new user.
 */
export function useUserPost() {
    const queryClient = useQueryClient();
    const mutation = useMutation<User, Response, User>(createUser, {
        onSuccess: newUser => {
            queryClient.setQueryData(["users", newUser.username], newUser);
            addToCachedList<User>("users", queryClient, newUser);
        },
    });
    return mutation;
}
