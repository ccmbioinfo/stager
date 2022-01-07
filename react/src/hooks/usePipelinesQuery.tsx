import { useSnackbar } from "notistack";
import { useQuery } from "react-query";
import { Pipeline } from "../typings";
import { basicFetch } from "./utils";

async function fetchPipelines() {
    return await basicFetch("/api/pipelines");
}

export function usePipelinesQuery() {
    const { enqueueSnackbar } = useSnackbar();
    const result = useQuery<Pipeline[], Response>("pipelines", fetchPipelines, {
        staleTime: Infinity,
        onError: () => {
            enqueueSnackbar(`Error: failed to load pipelines for the pipeline filter.`, {
                variant: "error",
            });
        },
    });
    return result;
}
