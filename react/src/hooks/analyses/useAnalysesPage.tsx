import { useCallback } from "react";
import { Query, QueryResult } from "@material-table/core";
import { useQueryClient } from "react-query";
import { Analysis, AnalysisDetailed } from "../../typings";
import { basicFetch, queryTableData } from "../utils";

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
            // If analysis_id is specified, we'll use the individual GET endpoint
            const idFilter = query.filters.find(
                filter => filter.column.field === "analysis_id" && filter.value
            );
            if (idFilter && typeof idFilter.value === "string") {
                try {
                    const result = await queryClient.fetchQuery<string, Response, AnalysisDetailed>(
                        ["analyses", idFilter.value],
                        () => basicFetch(`${GET_ANALYSES_URL}/${idFilter.value}`)
                    );

                    return {
                        data: [result],
                        page: 0,
                        totalCount: 1,
                    };
                } catch {
                    return {
                        data: [],
                        page: 0,
                        totalCount: 0,
                    };
                }
            }

            return await queryClient.fetchQuery<QueryResult<Analysis>, Error>(
                ["analyses", query],
                () => fetchAnalyses(query)
            );
        },
        [queryClient]
    );

    return func;
}
