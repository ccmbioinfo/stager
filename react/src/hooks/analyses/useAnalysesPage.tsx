import { Query, QueryResult } from "material-table";
import { useQueryClient } from "react-query";
import { queryTableData } from "../utils";
import { Analysis } from "../../typings";

async function fetchAnalyses(query: Query<Analysis>) {
    const queryResult = await queryTableData<Analysis>(query, "/api/analyses");
    return queryResult;
}

/**
 * Return a function for paging analyses data.
 */
export function useAnalysesPage() {
    const queryClient = useQueryClient();

    return async (query: Query<Analysis>) => {
        return await queryClient.fetchQuery<QueryResult<Analysis>, Error>(["analyses", query], () =>
            fetchAnalyses(query)
        );
    };
}
