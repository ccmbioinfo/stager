import { useQuery } from "react-query";
import { User } from "../../typings";
import { basicFetch } from "../utils";

async function fetchAllUsers() {
    return await basicFetch("/api/users");
}

/**
 * Return result of GET /api/users
 *
 * That is, returns a list of all users.
 */
export function useUsersQuery(): User[] {
    const result = useQuery<User[], Response>("users", fetchAllUsers);
    if (result.isSuccess) return result.data;
    return [];
}
