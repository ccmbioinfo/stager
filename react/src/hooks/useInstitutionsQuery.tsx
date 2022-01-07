import { useSnackbar } from "notistack";
import { useQuery } from "react-query";
import { basicFetch } from "./utils";

async function fetchInstitutions() {
    return await basicFetch("/api/institutions");
}

/**
 * Return query object for GET /api/institutions
 */
export function useInstitutionsQuery() {
    const { enqueueSnackbar } = useSnackbar();
    const result = useQuery<string[], Response>("institutions", fetchInstitutions, {
        staleTime: Infinity,
        onError: () => {
            enqueueSnackbar(`Error: failed to load institutions for the dropdown selection.`, {
                variant: "error",
            });
        },
    });
    return result;
}
