import React, { forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react';
import FormControl from '@material-ui/core/FormControl';
import { Button, makeStyles } from '@material-ui/core';
import DescriptionIcon from '@material-ui/icons/Description';
import { FileDrop } from 'react-file-drop';

// TODO: pretty it up

const useStyles = makeStyles(theme => ({
    root: {
    },
    input: {
        display: 'none',
    }
}));

export interface InputFileUploadProps {
    onUpload: (files: FileList | null) => void
}

export function InputFileUpload(props: InputFileUploadProps) {
    const classes = useStyles();
    
    return (
    <>
        <input
        accept=".csv"
        className={classes.input}
        id="contained-button-file"
        type="file"
        onChange={
            (e: React.SyntheticEvent<HTMLInputElement>) => {
                props.onUpload(e.currentTarget.files);
            }
        }
        />
        <label htmlFor="contained-button-file">
        <FileDrop
            onDrop={(files, event) => props.onUpload(files)}
        >
            <Button variant="contained" component="span" endIcon={<DescriptionIcon/>}>
                Select .CSV Sample Sheet
            </Button>
        </FileDrop>
        </label>
    </>
    );
}