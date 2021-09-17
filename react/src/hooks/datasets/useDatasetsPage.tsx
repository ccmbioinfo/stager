import { Query, QueryResult } from "@material-table/core";
import { useQueryClient } from "react-query";
import { Dataset } from "../../typings";

import { queryTableData } from "../utils";

export const GET_DATASETS_URL = "/api/datasets";

async function fetchDatasets(query: Query<Dataset>) {
    console.log("QUERY", query);
    const queryResult = await queryTableData(query, GET_DATASETS_URL);
    return queryResult;
}

/**
 * Return a function for GET /api/analyses with query parameters.
 *
 * Used with material-table's remote data feature.
 */
export function useDatasetsPage() {
    const queryClient = useQueryClient();
    return async (query: Query<Dataset>) => {
        return await queryClient.fetchQuery<QueryResult<Dataset>, Error>(["datasets", query], () =>
            fetchDatasets(query)
        );
    };
}
