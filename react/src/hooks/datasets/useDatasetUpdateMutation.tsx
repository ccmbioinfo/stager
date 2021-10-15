import { useMutation, useQueryClient } from "react-query";
import { Dataset } from "../../typings";
import { changeFetch } from "../utils";

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
        onSuccess: () => queryClient.invalidateQueries("datasets"),
    });
    return mutation;
}
