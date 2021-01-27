import { useMutation, useQueryClient } from "react-query";
import { User, NewUser } from "../../typings";
import { addToCachedList, changeFetch } from "../utils";

async function createUser(newUser: NewUser) {
    return changeFetch("/api/users", "POST", newUser);
}

/**
 * Return a mutation object for POST /api/users/:username.
 *
 * Used for creating a new user.
 */
export function useUsersCreateMutation() {
    const queryClient = useQueryClient();
    const mutation = useMutation<User, Response, NewUser>(createUser, {
        onSuccess: user => {
            queryClient.setQueryData(["users", user.username], user);
            addToCachedList<User>("users", queryClient, user);
        },
    });
    return mutation;
}
