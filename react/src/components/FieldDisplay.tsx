import React from "react";
import { Typography } from "@material-ui/core";
import { formatFieldValue } from "../functions";
import { FieldDisplayValueType } from "../typings";

export interface FieldDisplayProps {
    title: string;
    value?: FieldDisplayValueType;
    className?: string;
    bool?: boolean;
}

/* Simple Typography component to display "title: value" */
export default function FieldDisplay(props: FieldDisplayProps) {
    return (
        <Typography variant="body1" gutterBottom>
            <b>{props.title}:</b>{" "}
            <span className={props.className}>
                {formatFieldValue(props.value, props.bool, false)}
            </span>
        </Typography>
    );
}
