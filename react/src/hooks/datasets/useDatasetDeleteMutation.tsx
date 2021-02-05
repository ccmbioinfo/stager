import { useMutation, useQueryClient } from "react-query";
import { Dataset } from "../../typings";
import { changeFetch, deleteFromCachedList } from "../utils";

async function deleteDataset(id: string) {
    return changeFetch("/api/datasets/" + id, "DELETE", null, {
        onSuccess: async response => response,
    });
}

export function useDatasetDeleteMutation() {
    const queryClient = useQueryClient();
    const mutation = useMutation<Response, Response, string>(deleteDataset, {
        onSuccess: (res, id) => {
            queryClient.removeQueries(["datasets", id]);
            // TODO: Add exact key matching
            deleteFromCachedList<Dataset>("datasets", queryClient, id, "dataset_id");
        },
    });
    return mutation;
}
