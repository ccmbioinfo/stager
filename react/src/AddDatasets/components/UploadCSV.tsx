import React, { useState } from "react";
import { Box, IconButton, makeStyles, Typography } from "@material-ui/core";
import { FileDrop } from "react-file-drop";
import { Add } from "@material-ui/icons";

const useStyles = makeStyles(theme => ({
    root: {},
    input: {
        display: "none",
    },
    dropzone: {
        cursor: "pointer",
        p: 2,
        alignItems: "center",
        backgroundColor: theme.palette.info.dark,
    },
}));

export interface InputFileUploadProps {
    onUpload: (files: FileList | null) => void;
}

export function InputFileUpload(props: InputFileUploadProps) {
    const classes = useStyles();

    const ref = React.createRef<HTMLInputElement>();
    const helperDefault = "Add new .CSV file...";
    const [helperText, setHelperText] = useState(helperDefault);
    const [isDragging, setIsDragging] = useState(false);

    function getSize(file: File) {
        let size = file.size;
        const sizes = ["KB", "MB", "GB", "TB"];
        let i = -1;
        do {
            size /= 1024;
            i += 1;
        } while (size > 1024 && i < sizes.length);
        let sizeRounded = Math.round(size * 10) / 10;
        return `${sizeRounded} ${sizes[i]}`;
    }

    // Changes the helper text to the file name + size
    function onChange(files: FileList | null) {
        if (files && files[0]) {
            const file = files[0];
            setHelperText(`${file.name} - ${getSize(file)}`);
        } else {
            setHelperText(helperDefault);
        }
    }

    return (
        <>
            <input
                accept=".csv"
                className={classes.input}
                id="contained-button-file"
                type="file"
                onChange={(e: React.SyntheticEvent<HTMLInputElement>) => {
                    props.onUpload(e.currentTarget.files);
                    onChange(e.currentTarget.files);
                }}
                ref={ref}
            />
            <label htmlFor="contained-button-file">
                <FileDrop
                    onDrop={(files: FileList | null, event: React.DragEvent<HTMLDivElement>) => {
                        props.onUpload(files);
                        onChange(files);
                        setIsDragging(false);
                    }}
                    onFrameDragEnter={(event: DragEvent) => {
                        setIsDragging(true);
                    }}
                    onFrameDragLeave={(event: DragEvent) => {
                        setIsDragging(false);
                    }}
                >
                    <Box
                        display="flex"
                        boxShadow={isDragging ? 0 : 1}
                        className={classes.dropzone}
                        py={isDragging ? 20 : 0}
                    >
                        <Box alignItems="center">
                            <IconButton onClick={e => ref.current!.click()}>
                                <Add />
                            </IconButton>
                        </Box>
                        <Box flexGrow={1} alignItems="center">
                            <Typography>{helperText}</Typography>
                        </Box>
                    </Box>
                </FileDrop>
            </label>
        </>
    );
}
