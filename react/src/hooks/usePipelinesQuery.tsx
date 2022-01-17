import { useQuery } from "react-query";
import { Pipeline } from "../typings";
import { basicFetch } from "./utils";

async function fetchPipelines() {
    return await basicFetch("/api/pipelines");
}

export function usePipelinesQuery() {
    const result = useQuery<Pipeline[], Response>("pipelines", fetchPipelines, {
        staleTime: Infinity,
    });
    return result;
}
