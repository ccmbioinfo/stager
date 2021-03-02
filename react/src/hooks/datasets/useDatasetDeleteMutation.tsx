import { useMutation, useQueryClient } from "react-query";
import { changeFetch } from "../utils";

async function deleteDataset(id: string) {
    return changeFetch("/api/datasets/" + id, "DELETE", null, {
        onSuccess: async response => response,
    });
}

/**
 * Return mutation object for DELETE /api/datasets/:id.
 *
 * Used for deleting a dataset by id.
 */
export function useDatasetDeleteMutation() {
    const queryClient = useQueryClient();
    const mutation = useMutation<Response, Response, string>(deleteDataset, {
        onSuccess: (res, id) => {
            queryClient.invalidateQueries("datasets");
            queryClient.removeQueries(["datasets", id]);
        },
    });
    return mutation;
}
