import { useMutation, useQueryClient } from "react-query";
import { Analysis } from "../../typings";
import { changeFetch, updateInCachedList } from "../utils";

async function patchAnalysis(newAnalysis: Analysis) {
    return await changeFetch("/api/analyses/" + newAnalysis.analysis_id, "PATCH", newAnalysis);
}

/**
 * Return a mutation object for PATCH /api/analyses/:id.
 *
 * Used for updating fields of a particular analysis.
 */
export function useAnalysisUpdateMutation() {
    const queryClient = useQueryClient();
    const mutation = useMutation<Analysis, Response, Analysis>(patchAnalysis, {
        onSuccess: newAnalysis => {
            queryClient.setQueryData(["analyses", newAnalysis.analysis_id], newAnalysis);
            // TODO: Replace below with invalidate queries after overfetch #283
            updateInCachedList<Analysis>("analyses", queryClient, newAnalysis, "analysis_id");
        },
    });
    return mutation;
}
