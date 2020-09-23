import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import FormControl from '@material-ui/core/FormControl';
import { Button, makeStyles } from '@material-ui/core';
import DescriptionIcon from '@material-ui/icons/Description';

// TODO: file dropzone (drag-and-drop); pretty it up

const useStyles = makeStyles(theme => ({
    root: {
    },
    input: {
        display: 'none',
    }
}));

export interface InputFileUploadProps {
    onChange: (e: React.SyntheticEvent<HTMLInputElement>) => void
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
        onChange={props.onChange}
        />
        <label htmlFor="contained-button-file">
        <Button variant="contained" component="span" endIcon={<DescriptionIcon/>}>
            Select .CSV Sample Sheet
        </Button>
        </label>
    </>
    );
}