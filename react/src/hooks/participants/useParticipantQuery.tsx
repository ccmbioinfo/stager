import { useQuery } from "react-query";
import { Participant } from "../../typings";
import { basicFetch } from "../utils";

async function fetchDataset(id: string) {
    const result: Participant = await basicFetch("/api/participants/" + id);
    result.dataset_types = result.tissue_samples.flatMap(({ datasets }) =>
        datasets.map(dataset => dataset.dataset_type)
    );
    return result;
}

/**
 * Return result of GET /api/participants/:id.
 *
 * That is, return a JSON object of the participant which
 * includes codenames for the participant and family
 * metadata for the participant and tissue sample.
 */
export function useParticipantQuery(id: string) {
    const result = useQuery<Participant, Response>(["participants", id], () => fetchDataset(id));
    return result;
}
