import React from "react";
import { Box } from "@material-ui/core";
import SecretDisplay from "./SecretDisplay";

export default function MinioKeyDisplay(props: {
    loading?: boolean;
    minio_access_key?: string;
    minio_secret_key?: string;
}) {
    return (
        <Box>
            <SecretDisplay
                title="MinIO Access Key"
                secret={props.minio_access_key}
                loading={props.loading}
            />
            <SecretDisplay
                title="MinIO Secret Key"
                secret={props.minio_secret_key}
                loading={props.loading}
            />
        </Box>
    );
}
