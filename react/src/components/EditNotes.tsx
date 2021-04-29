import React from "react";
import { TextField } from "@material-ui/core";
import { EditComponentProps } from "material-table";

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
