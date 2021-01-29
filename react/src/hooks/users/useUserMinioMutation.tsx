import { useMutation, useQueryClient } from "react-query";
import { MinioKeys } from "../../components";
import { User } from "../../typings";
import { changeFetch } from "../utils";

async function resetMinioCredentials(username: string) {
    return changeFetch("/api/users/" + username, "POST", { dummy: true });
}

/**
 * Return a mutation object for POST /api/users/:username.
 *
 * Used for resetting the MinIO credentials for a given user.
 */
export function useUserMinioMutation() {
    const queryClient = useQueryClient();
    const mutation = useMutation<MinioKeys, Response, string>(resetMinioCredentials, {
        onSuccess: (minioKeys, username) => {
            const existingUser = queryClient.getQueryData<User>(["users", username]);
            if (existingUser !== undefined) {
                queryClient.setQueryData(["users", username], {
                    ...existingUser,
                    minio_access_key: minioKeys.minio_access_key,
                    minio_secret_key: minioKeys.minio_secret_key,
                });
            }
        },
    });
    return mutation;
}
