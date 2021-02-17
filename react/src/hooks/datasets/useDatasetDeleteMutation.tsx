import { useMutation, useQueryClient } from "react-query";
import { Dataset } from "../../typings";
import { changeFetch, deleteFromCachedList } from "../utils";

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
            queryClient.removeQueries(["datasets", id]);
            // TODO: Replace below with invalidate queries after #283
            deleteFromCachedList<Dataset>("datasets", queryClient, id, "dataset_id");
        },
    });
    return mutation;
}
