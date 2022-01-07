import { useQuery, UseQueryOptions } from "react-query";
import { User } from "../../typings";
import { basicFetch } from "../utils";

async function fetchUser(username: string) {
    return await basicFetch("/api/users/" + username);
}

/**
 * Return result of GET /api/users/:username
 *
 * That is, return all details about a particular user,
 * including MinIO credentials.
 */
export function useUserQuery(username: string, options: UseQueryOptions<User, Response> = {}) {
    const result = useQuery<User, Response>(["users", username], () => fetchUser(username), {
        ...options,
    });
    return result;
}
