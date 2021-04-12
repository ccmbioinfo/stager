import { useQuery } from "react-query";
import { Gene } from "../../typings";
import { basicFetch } from "../utils";

async function fetchGenes(params: Record<string, any>) {
    return await basicFetch("/api/genes", params);
}

/**
 * Return result of GET /api/genes.
 *
 */
export const useGenesQuery = (params: Record<string, any> = {}, enabled: boolean = true) =>
    useQuery<{ data: Gene[] }, Response>(
        ["genes", params],
        fetchGenes.bind(null, { ...params, limit: 25 }),
        {
            enabled,
        }
    );
