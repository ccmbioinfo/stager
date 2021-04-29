import { Variant } from "@material-ui/core/styles/createTypography";
import { QueryObserverOptions, useQuery } from "react-query";
import { BlobResponse } from "../../typings";
import { basicFetch, fetchCsv } from "../utils";

async function fetchVariants(params: Record<string, any>, returnType: "csv" | "json" = "csv") {
    const headers = { Accept: returnType === "csv" ? "text/csv" : "application/json" };
    if (returnType === "csv") {
        return fetchCsv("/api/summary/variants", params, { headers });
    } else {
        return await basicFetch("/api/summary/variants", params, { headers });
    }
}

/**
 * Return response of GET /api/variants
 */



export const useVariantsQuery = <T extends "csv" | "json">(
    params: Record<string, any>,
    returnType: T,
    options: QueryObserverOptions<T extends "csv" ? BlobResponse : Variant[], Response>
) => {
    if (returnType === "csv") {
        //never refetch csv
        options.staleTime = Infinity;
        options.retry = false;
        options.refetchInterval = false;
        options.refetchOnMount = false;
    }

    return useQuery<T extends "csv" ? BlobResponse : Variant[], Response>(
        ["variants", returnType, params],
        fetchVariants.bind(null, params, returnType),
        options
    );
};
