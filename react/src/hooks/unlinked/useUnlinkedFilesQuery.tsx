import { useQuery } from "react-query";
import { UnlinkedFile } from "../../typings";
import { basicFetch } from "../utils";

async function fetchFilesNoPrefix() {
    return await basicFetch("/api/unlinked");
}

async function fetchFiles(prefix: string) {
    console.log('fetchfiles', prefix)
    return await basicFetch(`api/unlinked/${prefix}`);
}

/**
 * Return result of GET /api/unlinked.
 *
 * That is, return a sorted list of filenames
 * for all unlinked files in MinIO.
 */

export function useUnlinkedFilesQuery() {
    const result = useQuery<UnlinkedFile[], Response>("unlinked", fetchFilesNoPrefix
    );
    return result;
}

export function useUnlinkedFilesQueryPrefix (prefix: string) {
    console.log('prefix', prefix)
    const result = useQuery<string, Response, UnlinkedFile[]>(["unlinked", prefix], () =>
    fetchFiles(prefix)
    );
    return result;
}
