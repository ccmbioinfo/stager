import { useSnackbar } from "notistack";
import { useQuery, UseQueryOptions } from "react-query";
import { Family } from "../../typings";
import { basicFetch } from "../utils";

async function fetchFamilies(params: Record<string, any>) {
    return await basicFetch("/api/families", params);
}

/**
 * Return result of GET /api/families.
 *
 * That is, return an array of all families.
 */
export function useFamiliesQuery(familyCodename?: string) {
    const { enqueueSnackbar } = useSnackbar();
    const params = {
        starts_with: familyCodename,
    };
    const options: UseQueryOptions<Family[], Response> = {
        onError: () =>{
            enqueueSnackbar(`Error: failed to load existing family codenames.`,{
                variant: "error",
            });
        }
    };
    const result = useQuery<Family[], Response>(
        familyCodename ? ["families", params] : "families",
        () => fetchFamilies(params),
        { ...options }
    );
    return result;
}
