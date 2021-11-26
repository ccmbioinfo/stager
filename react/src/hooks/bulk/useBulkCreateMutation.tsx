import { useMutation, useQueryClient } from "react-query";
import { DataEntryFields, Dataset } from "../../typings";
import { basicFetch } from "../utils";

interface DatasetSubmitParameters {
    data: DataEntryFields[];
    asGroups: string[];
}

async function submitDatasets(parameters: DatasetSubmitParameters) {
    const { data, asGroups } = parameters;
    const params = asGroups.length > 0 ? `?groups=${asGroups.join(",")}` : "";
    const response = await basicFetch(
        "/api/_bulk" + params,
        {},
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        }
    );

    return response as Dataset[];
}

/**
 * Return a mutation object for POST /api/_bulk.
 *
 * Used for submitting new datasets.
 */
export function useBulkCreateMutation() {
    const queryClient = useQueryClient();
    const mutation = useMutation<Dataset[], Response, DatasetSubmitParameters>(submitDatasets, {
        onSuccess: () => {
            // Invalidates all queries that begin with 'participants'
            queryClient.invalidateQueries("participants");
            queryClient.invalidateQueries("datasets");
        },
    });
    return mutation;
}
