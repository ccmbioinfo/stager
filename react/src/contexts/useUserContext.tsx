import React, { useContext } from "react";
import { CurrentUser } from "../typings";

export const emptyUser: CurrentUser = {
    username: "",
    last_login: "",
    is_admin: false,
    groups: [],
};

interface UserClient {
    user: CurrentUser;
    updateUser: (newUser: Partial<CurrentUser>) => void;
}

// Stores info about the currently signed-in user
export const UserContext = React.createContext<UserClient>({
    user: emptyUser,
    updateUser: () => {},
});

/**
 * Return information about the current signed-in user.
 */
export function useUserContext() {
    return useContext(UserContext);
}
