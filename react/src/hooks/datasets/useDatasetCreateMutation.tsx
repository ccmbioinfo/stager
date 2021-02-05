import { useMutation, useQueryClient } from "react-query";
import { Dataset } from "../../typings";
import { addToCachedList, changeFetch } from "../utils";

async function createDataset(dataset: Dataset) {
    return changeFetch("/api/datasets", "POST", dataset);
}

export function useDatasetCreateMutation() {
    const queryClient = useQueryClient();
    const mutation = useMutation<Dataset, Response, Dataset>(createDataset, {
        onSuccess: newDataset => {
            queryClient.setQueryData(["datasets", newDataset.dataset_id], newDataset);
            // TODO: Add exact key matching
            addToCachedList<Dataset>("datasets", queryClient, newDataset);
        },
    });
    return mutation;
}
