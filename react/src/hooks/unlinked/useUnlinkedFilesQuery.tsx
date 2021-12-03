import { useQuery } from "react-query";
import { UnlinkedFile } from "../../typings";
import { basicFetch } from "../utils";

async function fetchFiles(prefix: string) {
    return await basicFetch("/api/unlinked/" + prefix);
}

/**
 * Return result of GET /api/unlinked.
 *
 * That is, return a sorted list of filenames
 * for all unlinked files in MinIO.
 */

export function useUnlinkedFilesQuery(prefix: string) {
    const result = useQuery<string, Response, UnlinkedFile[]>(["unlinked", prefix], () =>
        fetchFiles(prefix)
    );
    return result;
}
