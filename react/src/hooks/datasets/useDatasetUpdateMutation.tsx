import { useMutation, useQueryClient } from "react-query";
import { Dataset } from "../../typings";
import { changeFetch, updateInCachedList } from "../utils";

async function patchDataset(newDataset: Partial<Dataset>) {
    return changeFetch("/api/datasets/" + newDataset.dataset_id, "PATCH", newDataset);
}

/**
 * Return a mutation object for PATCH /api/datasets/:id.
 *
 * Used for updating the fields of a dataset.
 */
export function useDatasetUpdateMutation() {
    const queryClient = useQueryClient();
    const mutation = useMutation<Dataset, Response, Partial<Dataset>>(patchDataset, {
        onSuccess: newDataset => {
            queryClient.setQueryData(["datasets", newDataset.dataset_id], newDataset);
            // TODO: Replace below with invalidate queries after #283
            updateInCachedList<Dataset>("datasets", queryClient, newDataset, "dataset_id");
        },
    });
    return mutation;
}
