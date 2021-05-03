import { Variant } from "@material-ui/core/styles/createTypography";
import { QueryObserverOptions, useQuery } from "react-query";
import { basicFetch } from "../utils";

export const GET_VARIANTS_SUMMARY_URL = "/api/summary/variants";

async function fetchVariants(params: Record<string, any>) {
    return await basicFetch(GET_VARIANTS_SUMMARY_URL, params);
}

/**
 * Return response of GET /api/variants
 */

export const useVariantsQuery = (
    params: Record<string, any>,
    options: QueryObserverOptions<Variant[], Response>
) => {
    return useQuery<Variant[], Response>(
        ["variants", params],
        fetchVariants.bind(null, params),
        options
    );
};
