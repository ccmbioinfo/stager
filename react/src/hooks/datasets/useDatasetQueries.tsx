import { DatasetDetailed } from "../../typings";
import { basicFetch, useQueriesTyped } from "../utils";

async function fetchDataset(id: string): Promise<DatasetDetailed> {
    return await basicFetch("/api/datasets/" + id);
}

/**
 * Return results for multiple GET /api/datasets/:id requests.
 */
export function useDatasetQueries(dataset_ids: string[]) {
    const results = useQueriesTyped(
        dataset_ids.map(id => ({
            queryKey: ["datasets", id],
            queryFn: () => fetchDataset(id),
        }))
    );
    return results;
}
