import { useMutation, useQueryClient } from "react-query";

import { Participant } from "../../typings";
import { changeFetch } from "../utils";

async function patchFamily(newFamily: Partial<Participant>) {
    return changeFetch("/api/families/" + newFamily.family_id, "PATCH", newFamily);
}

/**
 * Return a mutation object for PATCH /api/families/:id.
 *
 * Used for updating the fields of a family.
 */
export function useFamilyUpdateMutation() {
    const queryClient = useQueryClient();
    const mutation = useMutation<Participant, Response, Partial<Participant>>(patchFamily, {
        onSuccess: () => queryClient.invalidateQueries("families"),
    });
    return mutation;
}
