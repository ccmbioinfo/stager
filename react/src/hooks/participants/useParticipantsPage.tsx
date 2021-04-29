import { Query, QueryResult } from "material-table";
import { useQuery, useQueryClient, UseQueryOptions } from "react-query";
import { fetchCsv, getSearchParamsFromMaterialTableQuery, queryTableData } from "../utils";
import { BlobResponse, Participant } from "../../typings";

async function fetchParticipants(query: Query<Participant>) {
    // fetch
    const queryResult = await queryTableData<Participant>(query, "/api/participants");
    // format results
    queryResult.data.forEach((participant: Participant) => {
        participant.dataset_types = participant.tissue_samples.flatMap(({ datasets }) =>
            datasets.map(dataset => dataset.dataset_type)
        );
        participant.affected += "";
        participant.solved += "";
    });

    return queryResult;
}

const fetchParticipantCsv = async (params: Record<string, string>) => {
    const headers = { Accept: "text/csv" };
    return fetchCsv("/api/participants", params, { headers });
};

/**
 * Used with material-table's remote data feature.
 */
export const useParticipantCsvQuery = (query: Query<Participant>, enabled?: boolean) => {
    //never refetch csv
    query.page = 0;
    query.pageSize = -1;

    const params = getSearchParamsFromMaterialTableQuery(query);

    const options: UseQueryOptions<BlobResponse, Response> = {
        staleTime: Infinity,
        retry: false,
        refetchInterval: false,
        refetchOnMount: false,
    };

    return useQuery<BlobResponse, Response>(
        ["participants", "csv", params],
        fetchParticipantCsv.bind(null, params),
        { ...options, enabled }
    );
};

/**
 * Return a function for paging participant data.
 *
 * Used with material-table's remote data feature.
 */
export function useParticipantsPage() {
    const queryClient = useQueryClient();

    return async (query: Query<Participant>) => {
        return await queryClient.fetchQuery<QueryResult<Participant>, Error>(
            ["participants", query],
            () => fetchParticipants(query)
        );
    };
}
