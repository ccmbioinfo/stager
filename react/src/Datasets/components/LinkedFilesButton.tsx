import React, { useState } from "react";
import { ButtonBase, makeStyles } from "@material-ui/core";
import LinkedFilesPopover from "./LinkedFilesPopover";

const useStyles = makeStyles(theme => ({
    button: {
        padding: theme.spacing(0, 1),
        borderRadius: theme.shape.borderRadius,
    },
}));

export default function LinkedFilesButton(props: { fileNames: string[] }) {
    const classes = useStyles();
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
            <ButtonBase disabled={length === 0} onClick={handleClick} className={classes.button}>
                <span>{`${length} file${length === 1 ? "" : "s"}`}</span>
            </ButtonBase>
        </>
    );
}
