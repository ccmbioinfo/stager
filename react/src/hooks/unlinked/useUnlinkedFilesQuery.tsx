import { useQuery } from "react-query";

async function fetchFiles() {
    return await basicFetch("/api/unlinked");
}

/**
 * Return result of GET /api/unlinked.
 *
 * That is, return a sorted list of filenames
 * for all unlinked files in MinIO.
 */
export function useUnlinkedFilesQuery() {
    const result = useQuery<string[], Response>("unlinked", fetchFiles);
    if (result.isSuccess) result.data = result.data.sort();
    return result;
}
