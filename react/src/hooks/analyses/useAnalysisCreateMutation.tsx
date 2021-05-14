import { useMutation, useQueryClient } from "react-query";
import { Analysis, AnalysisPriority, Dataset, Pipeline } from "../../typings";
import { changeFetch, invalidateAnalysisPredicate } from "../utils";

interface NewAnalysisParams {
    datasets: Dataset["dataset_id"][];
    pipeline_id: Pipeline["pipeline_id"];
    priority?: AnalysisPriority;
    notes?: string;
}

async function createAnalysis(params: NewAnalysisParams) {
    if (params.notes?.trim() === "") params.notes = undefined;
    return await changeFetch("/api/analyses", "POST", params);
}

/**
 * Return mutation object for POST /api/analyses.
 *
 * Used for creating a new analysis of a list of datasets
 * using a certain pipeline.
 */
export function useAnalysisCreateMutation() {
    const queryClient = useQueryClient();
    const mutation = useMutation<Analysis, Response, NewAnalysisParams>(createAnalysis, {
        onSuccess: newAnalysis => {
            queryClient.setQueryData(["analyses", newAnalysis.analysis_id], newAnalysis);
            queryClient.invalidateQueries({
                predicate: invalidateAnalysisPredicate,
            });
        },
    });
    return mutation;
}
