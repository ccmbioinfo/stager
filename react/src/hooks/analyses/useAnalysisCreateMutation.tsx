import { useMutation, useQueryClient } from "react-query";
import { Analysis, Dataset, Pipeline } from "../../typings";
import { addToCachedList, changeFetch } from "../utils";

interface NewAnalysisParams {
    datasets: Dataset["dataset_id"][];
    pipeline_id: Pipeline["pipeline_id"];
}

async function createAnalysis(params: NewAnalysisParams) {
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
            // TODO: Replace below with invalidateQueries after overfetch #283
            addToCachedList<Analysis>("analyses", queryClient, newAnalysis, {
                invalidateQueryFilters: {
                    exact: true,
                },
            });
        },
    });
    return mutation;
}
