import { useCallback } from "react";
import { Query, QueryResult } from "@material-table/core";
import { useQueryClient } from "react-query";
import { Analysis } from "../../typings";
import { queryTableData } from "../utils";

export const GET_ANALYSES_URL = "/api/analyses";

async function fetchAnalyses(query: Query<Analysis>) {
    const queryResult = await queryTableData<Analysis>(query, GET_ANALYSES_URL);
    return queryResult;
}

/**
 * Return a function for paging analyses data.
 */
export function useAnalysesPage() {
    const queryClient = useQueryClient();

    const func = useCallback(
        async (query: Query<Analysis>) => {
            return await queryClient.fetchQuery<QueryResult<Analysis>, Error>(
                ["analyses", query],
                () => fetchAnalyses(query)
            );
        },
        [queryClient]
    );

    return func;
}
