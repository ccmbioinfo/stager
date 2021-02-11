import dayjs from "dayjs";
import { QueryObserverResult, useQuery } from "react-query";
import { jsonToAnalyses } from "../../functions";
import { Analysis } from "../../typings";
import { basicFetch } from "../utils";

async function fetchAnalyses(since?: string) {
    let params = "";
    if (since) params = "?since=" + since;
    return await basicFetch("/api/analyses" + params);
}

/**
 * Return result of GET /api/analyses.
 *
 * That is, return a list of all analyses.
 *
 * Can take a parameter to limit returned analyses to
 * those that changed state after the provided date.
 */
export function useAnalysesQuery(since?: Date) {
    // Construct the query key based on whether 'since' is defined
    let queryKey: any[] | string = ["analyses"];
    let dateString: string | undefined;
    if (since) {
        dateString = dayjs(since).format("YYYY-MM-DDTHH:mm:ssZ");
        queryKey.push({ since: dateString });
    }
    if (queryKey.length === 1) queryKey = queryKey[0];

    const result = useQuery<any[], Response>(queryKey, () => fetchAnalyses(dateString), {
        staleTime: since && 0, // analyses since 'now' are immediately stale
    });
    if (result.isSuccess) result.data = jsonToAnalyses(result.data);
    return result as QueryObserverResult<Analysis[], Response>;
}
