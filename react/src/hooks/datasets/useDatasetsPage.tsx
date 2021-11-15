import { QueryResult } from "@material-table/core";
import { useQueryClient } from "react-query";
import { DatasetDetailed, QueryWithSearchOptions } from "../../typings";

import { queryTableData } from "../utils";

export const GET_DATASETS_URL = "/api/datasets";

async function fetchDatasets(query: QueryWithSearchOptions<DatasetDetailed>) {
    const queryResult = await queryTableData(query, GET_DATASETS_URL);
    return queryResult;
}

/**
 * Return a function for GET /api/datasets with query parameters.
 *
 * Used with material-table's remote data feature.
 */
export function useDatasetsPage() {
    const queryClient = useQueryClient();
    return async (query: QueryWithSearchOptions<DatasetDetailed>) => {
        return await queryClient.fetchQuery<QueryResult<DatasetDetailed>, Error>(["datasets", query], () =>
            fetchDatasets(query)
        );
    };
}
