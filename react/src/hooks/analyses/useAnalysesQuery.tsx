import { QueryResult } from "@material-table/core";
import dayjs from "dayjs";
import { useSnackbar } from "notistack";
import { QueryObserverResult, useQuery, UseQueryOptions } from "react-query";
import { jsonToAnalyses } from "../../functions";
import { Analysis } from "../../typings";
import { basicFetch } from "../utils";

async function fetchAnalyses(params: Record<string, string> = {}) {
    return await basicFetch("/api/analyses", params);
}

/**
 * Return result of GET /api/analyses.
 *
 * That is, return a list of all analyses.
 *
 * Can take a parameter to limit returned analyses to
 * those that changed state after the provided date.
 */
export function useAnalysesQuery(params: Record<string, any> = {}) {
    // Construct the query key based on whether 'since' is defined
    const { enqueueSnackbar } = useSnackbar();
    let queryKey: any[] | string = ["analyses"];
    let dateString: string | undefined;
    const { since, ...rest } = params;
    if (since) {
        dateString = dayjs(params.since).format("YYYY-MM-DDTHH:mm:ssZ");
        queryKey.push({ since: dateString });
        rest.updated = `after,${dateString}`;
    }
    if (queryKey.length === 1) queryKey = queryKey[0];

    const options: UseQueryOptions<QueryResult<Analysis>, Response> = {
        onError: () =>{
            enqueueSnackbar(`Error: failed to load analysis notification.`,{
                variant: "error",
            });
        }
    };

    const result = useQuery<QueryResult<Analysis>, Response>(queryKey,
        () => fetchAnalyses(rest),
        { ...options }
    );
    if (result.isSuccess)
        result.data = {
            ...result.data,
            data: jsonToAnalyses(result.data.data),
        };
    return result as QueryObserverResult<QueryResult<Analysis>, Response>;
}
