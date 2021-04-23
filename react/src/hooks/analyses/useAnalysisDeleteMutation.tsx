import { useMutation, useQueryClient } from "react-query";
import { changeFetch } from "../utils";

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
            queryClient.invalidateQueries({
                predicate: query =>
                    query.queryKey.length === 2 &&
                    query.queryKey[0] === "analyses" &&
                    (typeof query.queryKey[1] !== "string" || query.queryKey[1] === analysis_id),
            });
        },
    });
    return mutation;
}
