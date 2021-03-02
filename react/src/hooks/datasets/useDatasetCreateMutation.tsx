import { useMutation, useQueryClient } from "react-query";
import { Dataset } from "../../typings";
import { changeFetch } from "../utils";

async function createDataset(dataset: Dataset) {
    return changeFetch("/api/datasets", "POST", dataset);
}

/**
 * Return mutation object for POST /api/datasets.
 *
 * Used for creating a new dataset.
 */
export function useDatasetCreateMutation() {
    const queryClient = useQueryClient();
    const mutation = useMutation<Dataset, Response, Dataset>(createDataset, {
        onSuccess: newDataset => {
            queryClient.invalidateQueries("datasets");
            queryClient.setQueryData(["datasets", newDataset.dataset_id], newDataset);
        },
    });
    return mutation;
}
