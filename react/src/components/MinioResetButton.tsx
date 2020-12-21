import React, { useState } from "react";
import { Button, ButtonProps } from "@material-ui/core";
import { User } from "../typings";
import ConfirmModal from "./ConfirmModal";

export type MinioKeys = Partial<Pick<User, "minio_access_key" | "minio_secret_key">>;

export default function MinioResetButton(
    props: {
        username: string;
        onUpdate: (loading: boolean, keys: MinioKeys) => void;
    } & ButtonProps
) {
    const { username, onUpdate, ...buttonProps } = props;
    const [open, setOpen] = useState(false);

    function onMinioReset() {
        onUpdate(true, {});
        fetch(`/api/users/${username}`, {
            method: "POST",
            body: JSON.stringify({ username: username }),
            headers: {
                "Content-Type": "application/json",
            },
        })
            .then(response => response.json())
            .then(data =>
                onUpdate(false, {
                    minio_access_key: data.minio_access_key,
                    minio_secret_key: data.minio_secret_key,
                })
            );
    }

    return (
        <>
            <ConfirmModal
                id="confirm-modal-reset-minio-credentials"
                open={open}
                onClose={() => setOpen(false)}
                onConfirm={() => {
                    onMinioReset();
                    setOpen(false);
                }}
                title="Reset MinIO Credentials"
            >
                Are you sure you want to reset your MinIO credentials? This action cannot be undone.
            </ConfirmModal>

            <Button
                color="secondary"
                variant="contained"
                {...buttonProps}
                onClick={() => setOpen(true)}
            >
                Reset MinIO Credentials
            </Button>
        </>
    );
}
