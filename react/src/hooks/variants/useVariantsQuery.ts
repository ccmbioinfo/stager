import { useQuery } from "react-query";
import { Variant } from "../../typings";
import { basicFetch, fetchAndDownloadCsv } from "../utils";

async function fetchVariants(params: Record<string, any>, returnType: "csv" | "json" = "csv") {
    const headers = { Accept: returnType === "csv" ? "text/csv" : "application/json" };
    if (returnType === "csv") {
        return fetchAndDownloadCsv("/api/summary/variants", {}, { headers });
    } else {
        return await basicFetch("/api/summary/variants", params, { headers });
    }
}

/**
 * Return result of GET /api/variants
 *
 */
export const useVariantsQuery = (
    params: Record<string, any>,
    returnType: "csv" | "json",
    enabled: boolean
) =>
    useQuery<Variant[], Response>(
        ["variants", returnType, params],
        fetchVariants.bind(null, params, returnType),
        { enabled }
    );
