import React, { useState } from "react";
import { ButtonBase } from "@material-ui/core";
import LinkedFilesPopover from "./LinkedFilesPopover";

export default function LinkedFilesButton(props: { fileNames: string[] }) {
    const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

    function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
        setAnchorEl(event.currentTarget);
    }

    function handleClose() {
        setAnchorEl(null);
    }

    const open = Boolean(anchorEl);
    const length = props.fileNames.length;

    return (
        <>
            <LinkedFilesPopover
                open={open}
                anchorEl={anchorEl}
                fileNames={props.fileNames}
                onClose={handleClose}
                anchorOrigin={{
                    vertical: "bottom",
                    horizontal: "center",
                }}
                transformOrigin={{
                    vertical: "top",
                    horizontal: "center",
                }}
            />
            <ButtonBase disabled={length === 0} onClick={handleClick}>
                {`${length} file${length === 1 ? "" : "s"}`}
            </ButtonBase>
        </>
    );
}
