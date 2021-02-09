import { useQuery } from "react-query";
import { Dataset } from "../../typings";
import { basicFetch } from "../utils";

async function fetchDatasets() {
    return await basicFetch("/api/datasets");
}

/**
 * Return result of GET /api/datasets.
 *
 * That is, return a list of all datasets.
 *
 * TODO: Replace with useDatasetsPage once overfetch is ready. (#263)
 */
export function useDatasetsQuery() {
    const result = useQuery<Dataset[], Response>("datasets", fetchDatasets);
    return result;
}
