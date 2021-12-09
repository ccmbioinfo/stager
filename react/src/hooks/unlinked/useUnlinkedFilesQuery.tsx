import { useQuery } from "react-query";
import { UnlinkedFile } from "../../typings";
import { basicFetch } from "../utils";

async function fetchFiles(params: Record<string, string> = {}) {
    console.log("unlinked params", params);
    return await basicFetch("/api/unlinked", params);
}
/**
 * Return result of GET /api/unlinked.
 *
 * That is, return a sorted list of filenames
 * for all unlinked files in MinIO.
 */

export function useUnlinkedFilesQuery(params: Record<string, string> = {}) {
    console.log("useUnlinkedFilesQuery", params);
    const result = useQuery<Record<string, string>, Response, UnlinkedFile[]>(
        ["unlinked", params],
        () => fetchFiles(params)
    );
    return result;
}
