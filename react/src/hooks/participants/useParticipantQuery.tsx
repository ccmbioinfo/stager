import { useQuery } from "react-query";
import { Participant } from "../../typings";
import { basicFetch } from "../utils";

async function fetchDataset(id: string) {
    return await basicFetch("/api/participants/" + id);
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
