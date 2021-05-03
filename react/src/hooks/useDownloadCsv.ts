import { useEffect, useState } from "react";
import { useQuery, UseQueryOptions } from "react-query";
import { downloadCsv } from "../functions";
import { BlobResponse } from "../typings";
import { fetchCsv } from "./utils";

/**
 * Hook that returns a function for fetching and downloading a csv from an api endpoint
 *
 * @param path the URL of the csv endpoint
 * @param userOptions options to pass to useQuery
 *
 * @returns function that can be called many times with parameters
 */
export const useDownloadCsv = <P extends Record<string, string>>(
    path: string,
    userOptions: UseQueryOptions<BlobResponse, Response> = {}
) => {
    const [params, setParams] = useState<P>();
    const [enabled, setEnabled] = useState(false);

    const options: UseQueryOptions<BlobResponse, Response> = {
        staleTime: Infinity,
        retry: false,
        refetchInterval: false,
        refetchOnMount: false,
    };

    const { data: csvBlob } = useQuery<BlobResponse, Response>(
        [params, "csv", path],
        () => fetchCsv(path, params),
        { enabled, ...options, ...userOptions }
    );

    /*
           react-query cache will return a 'new' blob when parameters
           match a cache key, even if refetch hasn't been called or query is disabled,
           triggering a download. So we must explicitly
           enable/disable the query AND provide flag as a dependency.
    */
    useEffect(() => {
        if (csvBlob && enabled) {
            const { filename, blob } = csvBlob;
            downloadCsv(filename, blob);
            setEnabled(false);
        }
    }, [csvBlob, enabled]);

    const download = (userParams: P) => {
        setEnabled(true);
        setParams(userParams);
    };

    return download;
};
