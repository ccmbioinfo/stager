import { useSnackbar } from "notistack";
import { useQuery } from "react-query";
import { GeneAlias } from "../../typings";
import { basicFetch } from "../utils";

async function fetchGenes(params: Record<string, any>) {
    return await basicFetch("/api/summary/genes", params);
}

/**
 * Return result of GET /api/genes.
 *
 */
export function useGenesQuery(params: { search: string }, enabled: boolean = true) {
    const { enqueueSnackbar } = useSnackbar();
    return useQuery<{ data: GeneAlias[] }, Response>(
        ["genes", params],
        fetchGenes.bind(null, { ...params, limit: 25 }),
        {
            enabled,
            onError: () => {
                enqueueSnackbar(`Error: failed to load genes for dropdown selection.`, {
                    variant: "error",
                });
            },
        }
    );
}
