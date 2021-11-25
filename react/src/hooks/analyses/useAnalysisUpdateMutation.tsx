import { useMutation, useQueryClient } from "react-query";
import { Analysis, AnalysisChange } from "../../typings";
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
        onSuccess: () => {
            queryClient.invalidateQueries({
                predicate: invalidateAnalysisPredicate,
            });
        },
    });
    return mutation;
}
