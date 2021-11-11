import { Query, QueryResult } from "@material-table/core";
import { useQueryClient } from "react-query";
import { Participant } from "../../typings";
import { queryTableData } from "../utils";

export const GET_PARTICIPANTS_URL = "/api/participants";

async function fetchParticipants(query: Query<Participant>) {
    // fetch
    const queryResult = await queryTableData<Participant>(query, GET_PARTICIPANTS_URL);
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
