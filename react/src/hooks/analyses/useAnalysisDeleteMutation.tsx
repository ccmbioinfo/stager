import { useMutation, useQueryClient } from "react-query";
import { Analysis } from "../../typings";
import { changeFetch, deleteFromCachedList } from "../utils";

async function deleteAnalysis(analysis_id: string) {
    return await changeFetch<string, Response>("/api/analyses/" + analysis_id, "DELETE", null, {
        onSuccess: response => response.text(),
    });
}

/**
 * Return a mutation object for DELETE /api/analyses/:id.
 *
 * Used for deleting an analysis.
 */
export function useAnalysisDeleteMutation() {
    const queryClient = useQueryClient();
    const mutation = useMutation<string, Response, string>(deleteAnalysis, {
        onSuccess: (data, analysis_id) => {
            queryClient.removeQueries(["analyses", analysis_id]);
            // TODO: Replace below with invalidate queries after overfetch #283
            deleteFromCachedList<Analysis>("analyses", queryClient, analysis_id, "analysis_id");
        },
    });
    return mutation;
}
