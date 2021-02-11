import { useMutation, useQueryClient } from "react-query";
import { Analysis, AnalysisChange, AnalysisDetailed } from "../../typings";
import { changeFetch, updateInCachedList } from "../utils";

async function patchAnalysis(newAnalysis: AnalysisChange) {
    return await changeFetch("/api/analyses/" + newAnalysis.analysis_id, "PATCH", newAnalysis);
}

/**
 * Return a mutation object for PATCH /api/analyses/:id.
 *
 * Used for updating fields of a particular analysis.
 */
export function useAnalysisUpdateMutation() {
    const queryClient = useQueryClient();
    const mutation = useMutation<Analysis, Response, AnalysisChange>(patchAnalysis, {
        onSuccess: newAnalysis => {
            const oldAnalysis: AnalysisDetailed | undefined = queryClient.getQueryData([
                "analyses",
                newAnalysis.analysis_id,
            ]);
            const updatedAnalysis = { ...oldAnalysis, ...newAnalysis };
            queryClient.setQueryData(["analyses", newAnalysis.analysis_id], updatedAnalysis);
            // TODO: Replace below with invalidate queries after overfetch #283
            updateInCachedList<Analysis>("analyses", queryClient, updatedAnalysis, "analysis_id");
        },
    });
    return mutation;
}
