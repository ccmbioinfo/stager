import { useSnackbar } from "notistack";
import { useQuery, UseQueryOptions } from "react-query";
import { DatasetDetailed } from "../../typings";
import { basicFetch } from "../utils";

async function fetchDataset(id: string) {
    return await basicFetch("/api/datasets/" + id);
}

/**
 * Return result of GET /api/datasets/:id.
 *
 * That is, return a JSON object of the dataset which
 * includes an array of analyses that it is involved in,
 * metadata for the tissue sample, and codenames for the
 * participant and family.
 */
export function useDatasetQuery(id: string) {
    const { enqueueSnackbar } = useSnackbar();

    const options: UseQueryOptions<DatasetDetailed, Response> = {
        onError: () =>{
            enqueueSnackbar(`Error: failed to load detailed information for the dataset.`,{
                variant: "error",
            });
        }
    };

    const result = useQuery<DatasetDetailed, Response>(
        ["datasets", id],
        () => fetchDataset(id),
        { ...options }
    );
    return result;
}
