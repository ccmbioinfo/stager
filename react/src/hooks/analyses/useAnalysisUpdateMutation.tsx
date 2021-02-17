import { useMutation, useQueryClient } from "react-query";
import { Analysis, AnalysisChange, AnalysisDetailed } from "../../typings";
import { changeFetch, updateInCachedList } from "../utils";

interface UpdateSource {
    source?: "selection" | "row_edit";
}

export type AnalysisOptions = AnalysisChange & UpdateSource;

async function patchAnalysis(newAnalysis: AnalysisOptions) {
    const { source, ...analysis } = newAnalysis;
    const data = await changeFetch("/api/analyses/" + newAnalysis.analysis_id, "PATCH", analysis);
    if (source === "selection") {
        data.tableData = { checked: true };
    }
    return data;
}

/**
 * Return a mutation object for PATCH /api/analyses/:id.
 *
 * Used for updating fields of a particular analysis.
 */
export function useAnalysisUpdateMutation() {
    const queryClient = useQueryClient();
    const mutation = useMutation<Analysis, Response, AnalysisOptions>(patchAnalysis, {
        onSuccess: (newAnalysis, changes) => {
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
