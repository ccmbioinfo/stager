import { useMutation, useQueryClient } from "react-query";
import { Participant } from "../../typings";
import { changeFetch } from "../utils";

async function patchParticipant(newParticipant: Partial<Participant>) {
    return changeFetch("/api/participants/" + newParticipant.participant_id, "PATCH", newParticipant);
}

/**
 * Return a mutation object for PATCH /api/participants/:id.
 *
 * Used for updating the fields of a participant.
 */
export function useParticipantUpdateMutation() {
    const queryClient = useQueryClient();
    const mutation = useMutation<Participant, Response, Partial<Participant>>(patchParticipant, {
        onSuccess: () => queryClient.invalidateQueries("participants"),
    });
    return mutation;
}
