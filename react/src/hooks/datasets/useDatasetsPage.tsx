import { Query, QueryResult } from "material-table";
import { useQueryClient } from "react-query";
import { Dataset } from "../../typings";

import { queryTableData } from "../utils";

async function fetchDatasets(query: Query<Dataset>) {
    const queryResult = await queryTableData(query, "/api/datasets");
    return queryResult;
}

/**
 * Return a function for paging datasets.
 *
 * Used with material-table's remote data feature.
 */
export function useDatasetsPage() {
    const queryClient = useQueryClient();

    return async (query: Query<Dataset>) => {
        return await queryClient.fetchQuery<QueryResult<Dataset>, Error>(
            ["datasets", query],
            () => fetchDatasets(query) as Promise<QueryResult<Dataset>>
        );
    };
}
