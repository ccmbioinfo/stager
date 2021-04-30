import { useMutation, useQueryClient } from "react-query";
import { Analysis, AnalysisChange, AnalysisDetailed } from "../../typings";
import { changeFetch, invalidateAnalysisPredicate } from "../utils";

interface UpdateSource {
    source?: "selection" | "row-edit";
}

export type AnalysisOptions = AnalysisChange & UpdateSource;

async function patchAnalysis(newAnalysis: AnalysisOptions) {
    const { source, ...analysis } = newAnalysis;
    let updates: Partial<AnalysisChange> = analysis;
    if (source === "row-edit") {
        // We only allow updating these fields via the MTable row edit feature
        updates = {
            notes: analysis.notes,
            priority: analysis.priority,
            result_path: analysis.result_path,
            assignee: analysis.assignee,
            analysis_state: analysis.analysis_state,
        };
    }
    const data = await changeFetch("/api/analyses/" + newAnalysis.analysis_id, "PATCH", updates);
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
            let oldAnalysis: AnalysisOptions | Partial<AnalysisDetailed> | undefined;
            oldAnalysis = queryClient.getQueryData<AnalysisDetailed>([
                "analyses",
                newAnalysis.analysis_id,
            ]);
            if (!oldAnalysis) {
                // we may not have fetched for analysis details yet, so we account for that here
                const oldAnalyses = queryClient.getQueryData<Analysis[]>("analyses");
                if (oldAnalyses)
                    oldAnalysis = oldAnalyses.find(a => a.analysis_id === newAnalysis.analysis_id);
                else {
                    const { source, ...rest } = changes;
                    oldAnalysis = rest;
                }
            }
            const updatedAnalysis = { ...oldAnalysis, ...newAnalysis };
            queryClient.setQueryData(["analyses", newAnalysis.analysis_id], updatedAnalysis);
            queryClient.invalidateQueries({
                predicate: invalidateAnalysisPredicate,
            });
        },
    });
    return mutation;
}
