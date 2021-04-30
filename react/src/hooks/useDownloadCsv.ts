import { useEffect, useMemo, useState } from "react";
import { useQuery, UseQueryOptions } from "react-query";
import { downloadCsv } from "../functions";
import { BlobResponse } from "../typings";
import { fetchCsv } from "./utils";

export const useDownloadCsv = <P>(path: string) => {
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
        fetchCsv.bind(null, path, params, {}),
        { enabled, ...options }
    );

    useEffect(() => {
        if (csvBlob && enabled) {
            const { filename, blob } = csvBlob;
            downloadCsv(filename, blob);
            setEnabled(false);
        }
    }, [csvBlob, enabled]);

    const download = useMemo(
        () => (userParams: P) => {
            setEnabled(true);
            setParams(userParams);
        },
        []
    );

    return download;
};
