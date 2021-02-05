import { QueryResult } from "material-table";
import { Query, useQueryClient } from "react-query";
import { Dataset } from "../../typings";

import { basicFetch } from "../utils";
// TODO: Un-comment below and remove above after #283 for /api/datasets
// import { queryTableData } from "../utils";

async function fetchDatasets(query: Query<Dataset>) {
    return await basicFetch("/api/datasets");
    // TODO: Remove above and un-comment below after
    // overfetch for /api/datasets is implemented (#283)

    // const queryResult = await queryTableData(query, "/api/datasets");
    // return queryResult;
}

/**
 * Return a function for paging datasets.
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
