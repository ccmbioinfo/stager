import { useQuery, UseQueryOptions } from "react-query";
import { UnlinkedFile } from "../../typings";
import { basicFetch } from "../utils";

async function fetchFiles(params: Record<string, string> = {}) {
    return await basicFetch("/api/unlinked", params);
}
/**
 * Return result of GET /api/unlinked.
 *
 * That is, return a sorted list of filenames
 * for all unlinked files in MinIO.
 */

export function useUnlinkedFilesQuery(
    params: Record<string, string> = {},
    userOptions: UseQueryOptions<UnlinkedFile[], Response> = {}
) {
    const result = useQuery<UnlinkedFile[], Response>(
        ["unlinked", params],
        () => fetchFiles(params),
        {
            staleTime: 1000,
            retry: false,
            refetchInterval: false,
            refetchOnMount: false,
            ...userOptions,
        }
    );
    return result;
}
