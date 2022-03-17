import { useMutation, useQueryClient } from "react-query";
import { Analysis, AnalysisPriority, Dataset } from "../../typings";
import { changeFetch, invalidateAnalysisPredicate } from "../utils";

interface NewAnalysisParams {
    type: "new";
    datasets: Dataset["dataset_id"][];
    priority?: AnalysisPriority;
    notes?: string;
}

interface ReAnalysisParams {
    type: "reanalysis";
    analysis_id: Analysis["analysis_id"];
}

type CreateAnalysisParams = NewAnalysisParams | ReAnalysisParams;

async function createAnalysis(params: CreateAnalysisParams) {
    if (params.type === "new" && params.notes?.trim() === "") params.notes = undefined;
    if (params.type === "reanalysis")
        return changeFetch(`/api/analyses/${params.analysis_id}`, "POST");

    return changeFetch("/api/analyses", "POST", { ...params, type: undefined });
}

/**
 * Return mutation object for POST /api/analyses, or POST /api/analyses/:id.
 *
 * Used for creating a new analysis of a list of datasets
 * using a certain pipeline.
 *
 * If analysis_id is specified, request a re-analysis using that analysis_id
 * as a reference, and ignore other parameters.
 */
export function useAnalysisCreateMutation() {
    const queryClient = useQueryClient();
    const mutation = useMutation<Analysis, Response, CreateAnalysisParams>(createAnalysis, {
        onSuccess: () => {
            queryClient.invalidateQueries({
                predicate: invalidateAnalysisPredicate,
            });
        },
    });
    return mutation;
}
