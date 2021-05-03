import React from "react";
import { EditComponentProps } from "@material-table/core";
import { TextField } from "@material-ui/core";

export default function EditNotes<T extends object>(props: EditComponentProps<T>) {
    return (
        <TextField
            multiline
            value={props.value}
            onChange={event => props.onChange(event.target.value)}
            rows={4}
            fullWidth
        />
    );
}
