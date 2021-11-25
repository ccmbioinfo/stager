import React from "react";
import { Typography } from "@material-ui/core";
// import { formatFieldValue } from "../functions";
import { formatDisplayValue } from "../functions";
import { Field } from "../typings";

export interface FieldDisplayProps {
    field: Field;
}

/* Simple Typography component to display "title: value" */
export default function FieldDisplay({ field }: FieldDisplayProps) {
    return (
        <Typography variant="body1" gutterBottom>
            <b>{field.title}:</b> <span>{formatDisplayValue(field)}</span>
        </Typography>
    );
}
