import { useQuery } from "react-query";
import { Variant } from "../../typings";
//import { basicFetch } from "../utils";

async function fetchVariants(params: Record<string, any>, returnType: "csv" | "json" = "csv") {
    //const headers = { Accept: returnType === "csv" ? "text/csv" : "application/json" };
    console.log("fetching variants!");
    return [(true as unknown) as Variant];
    //return await basicFetch("/api/variants", params, { headers });
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
        ["variants", params],
        fetchVariants.bind(null, params, returnType),
        { enabled }
    );
