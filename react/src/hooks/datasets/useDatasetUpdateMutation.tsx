import { useMutation, useQueryClient } from "react-query";
import { Dataset } from "../../typings";
import { changeFetch, updateInCachedList } from "../utils";

async function patchDataset(newDataset: Dataset) {
    return changeFetch("/api/datasets/" + newDataset.dataset_id, "PATCH", newDataset);
}

export function useDatasetUpdateMutation() {
    const queryClient = useQueryClient();
    const mutation = useMutation<Dataset, Response, Dataset>(patchDataset, {
        onSuccess: newDataset => {
            queryClient.setQueryData(["datasets", newDataset.dataset_id], newDataset);
            // TODO: Add exact key matching
            updateInCachedList<Dataset>("datasets", queryClient, newDataset, "dataset_id");
        },
    });
    return mutation;
}
