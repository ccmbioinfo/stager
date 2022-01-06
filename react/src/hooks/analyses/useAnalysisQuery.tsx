import { useSnackbar } from "notistack";
import { useQuery, UseQueryOptions } from "react-query";
import { AnalysisDetailed } from "../../typings";
import { basicFetch } from "../utils";

async function fetchAnalysis(analysis_id: string) {
    return await basicFetch("/api/analyses/" + analysis_id);
}

/**
 * Return result of GET /api/analyses/:id.
 *
 * That is, return the details of a specific analysis, including
 * an array of datasets associated to it, and pipeline metadata.
 */
export function useAnalysisQuery(analysis_id: string) {
    const { enqueueSnackbar } = useSnackbar();

    const options: UseQueryOptions<string, Response, AnalysisDetailed> = {
        onError: () =>{
            enqueueSnackbar(`Error: failed to load detailed information for the analysis.`,{
                variant: "error",
            });
        }
    };

    const result = useQuery<string, Response, AnalysisDetailed>(
        ["analyses", analysis_id], () =>
        fetchAnalysis(analysis_id),
        { ...options }
    );
    return result;
}
