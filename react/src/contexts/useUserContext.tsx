import React, { useContext } from "react";
import { CurrentUser } from "../typings";

export const emptyUser: CurrentUser = {
    username: "",
    last_login: "",
    is_admin: false,
    groups: [],
};

// Stores info about the currently signed-in user
export const UserContext = React.createContext<CurrentUser>(emptyUser);

/**
 * Return information about the current signed-in user.
 */
export function useUserContext() {
    return useContext(UserContext);
}
