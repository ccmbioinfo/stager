import { useMutation, useQueryClient } from "react-query";
import { Analysis, AnalysisPriority, Dataset, Pipeline } from "../../typings";
import { changeFetch } from "../utils";

interface NewAnalysisParams {
    type: "new";
    datasets: Dataset["dataset_id"][];
    pipeline_id: Pipeline["pipeline_id"];
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

    return changeFetch("/api/analyses", "POST", params);
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
        onSuccess: newAnalysis => {
            queryClient.invalidateQueries("analyses");
        },
    });
    return mutation;
}
